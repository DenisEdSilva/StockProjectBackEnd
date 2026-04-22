import prismaClient from "../../prisma";
import { Prisma, StockMovimentType } from "@prisma/client";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface RevertParams {
    movementId: string | number;
    storeId: string | number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    ipAddress?: string;
    userAgent?: string;
}

class RevertStockService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(params: RevertParams) {
        const data = this.validateAndTransform(params);

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: data.storeId, isDeleted: false },
                select: { id: true, ownerId: true }
            });

            if (!store) throw new NotFoundError("StoreNotFound");

            this.checkAuthorization(data, store.ownerId);

            const movement = await tx.stockMoviment.findUnique({
                where: { id: data.movementId }
            });

            if (!movement || movement.isDeleted) throw new NotFoundError("MovementNotFound");
            if (!movement.isValid) throw new ConflictError("MovementAlreadyReverted");
            if (movement.storeId !== data.storeId) throw new ForbiddenError("MovementDoesNotBelongToStore");

            const originInventory = await tx.storeInventory.findUnique({
                where: {
                    storeId_productId: {
                        storeId: data.storeId,
                        productId: movement.productId
                    }
                }
            });

            if (!originInventory || originInventory.isDeleted) {
                throw new NotFoundError("ProductNotFoundInStoreInventory");
            }

            if (movement.type === StockMovimentType.TRANSFER) {
                return await this.handleTransferRevert(tx, data, movement, originInventory, store.ownerId);
            }

            return await this.handleStandardRevert(tx, data, movement, originInventory, store.ownerId);
        });
    }

    private async handleStandardRevert(
        tx: Prisma.TransactionClient, 
        data: any, 
        movement: any, 
        originInventory: any, 
        ownerId: number
    ) {
        const reverseType = movement.type === StockMovimentType.IN 
            ? StockMovimentType.OUT 
            : StockMovimentType.IN;

        const updated = await tx.storeInventory.updateMany({
            where: {
                id: originInventory.id,
                isDeleted: false,
                ...(reverseType === StockMovimentType.OUT && { stock: { gte: movement.stock } })
            },
            data: {
                stock: reverseType === StockMovimentType.IN 
                    ? { increment: movement.stock } 
                    : { decrement: movement.stock }
            }
        });

        if (updated.count === 0) throw new ConflictError("InsufficientStockToRevert");

        await tx.stockMoviment.update({
            where: { id: movement.id },
            data: { isValid: false }
        });

        const newMovement = await tx.stockMoviment.create({
            data: {
                productId: movement.productId,
                type: reverseType,
                stock: movement.stock,
                previousStock: originInventory.stock,
                storeId: movement.storeId,
                isValid: true,
                createdBy: data.performedByUserId
            }
        });

        await this.finalizeRevert(tx, data, movement, newMovement.id, ownerId);

        return { message: "MovementRevertedSuccessfully", id: newMovement.id };
    }

    private async handleTransferRevert(
        tx: Prisma.TransactionClient, 
        data: any, 
        movement: any, 
        originInventory: any, 
        ownerId: number
    ) {
        if (!movement.destinationStoreId) {
            throw new ValidationError("InvalidTransferMovement");
        }

        const updateDest = await tx.storeInventory.updateMany({
            where: {
                storeId: movement.destinationStoreId,
                productId: movement.productId,
                
                stock: { gte: movement.stock },
                isDeleted: false
            },
            data: {
                stock: { decrement: movement.stock }
            }
        });

        if (updateDest.count === 0) {
            throw new ConflictError("InsufficientStockInDestinationStore");
        }

        await tx.storeInventory.update({
            where: { id: originInventory.id },
            data: { stock: { increment: movement.stock } }
        });

        await tx.stockMoviment.update({
            where: { id: movement.id },
            data: { isValid: false }
        });

        if (movement.relatedMovementId) {
            await tx.stockMoviment.update({
                where: { id: movement.relatedMovementId },
                data: { isValid: false }
            });
        }

        await this.finalizeRevert(tx, data, movement, null, ownerId);

        return { message: "TransferRevertedSuccessfully" };
    }

    private async finalizeRevert(
        tx: Prisma.TransactionClient, 
        data: any, 
        oldMovement: any, 
        newId: number | null, 
        ownerId: number
    ) {
        const isOwnerUser = data.userType === 'OWNER';

        await this.activityTracker.track({ 
            tx, 
            storeId: data.storeId,
            userId: isOwnerUser ? data.performedByUserId : undefined
        });

        await this.auditLogService.create({
            action: "STOCK_REVERT",
            ownerId: ownerId,
            productId: oldMovement.productId,
            storeId: data.storeId,
            details: { 
                originalId: oldMovement.id, 
                revertId: newId,
                type: oldMovement.type,
                stockReverted: oldMovement.stock
            },
            userId: isOwnerUser ? data.performedByUserId : undefined,
            storeUserId: !isOwnerUser ? data.performedByUserId : undefined,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner: isOwnerUser
        }, tx);
    }

    private validateAndTransform(p: RevertParams) {
        const movementId = Number(p.movementId);
        const storeId = Number(p.storeId);

        if (isNaN(movementId)) throw new ValidationError("InvalidMovementId");
        if (isNaN(storeId)) throw new ValidationError("InvalidStoreId");

        return { ...p, movementId, storeId };
    }

    private checkAuthorization(data: any, ownerId: number) {
        if (data.userType === 'OWNER' && ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }
        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }
    }
}

export { RevertStockService };