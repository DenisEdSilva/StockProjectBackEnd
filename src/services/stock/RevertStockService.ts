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
                where: { id: data.movementId },
                include: { product: true }
            });

            if (!movement || movement.isDeleted) throw new NotFoundError("MovementNotFound");
            if (!movement.isValid) throw new ConflictError("MovementAlreadyReverted");
            if (movement.storeId !== data.storeId) throw new ForbiddenError("MovementDoesNotBelongToStore");

            if (movement.type === StockMovimentType.TRANSFER) {
                return await this.handleTransferRevert(tx, data, movement, store.ownerId);
            }

            return await this.handleStandardRevert(tx, data, movement, store.ownerId);
        });
    }

    private async handleStandardRevert(tx: Prisma.TransactionClient, data: any, movement: any, ownerId: number) {
        const reverseType = movement.type === StockMovimentType.IN 
            ? StockMovimentType.OUT 
            : StockMovimentType.IN;

        const updated = await tx.product.updateMany({
            where: {
                id: movement.productId,
                storeId: movement.storeId,
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
                previousStock: movement.product.stock,
                storeId: movement.storeId,
                isValid: true,
                createdBy: data.performedByUserId
            }
        });

        await this.finalizeRevert(tx, data, movement.id, newMovement.id, ownerId);

        return { message: "MovementRevertedSuccessfully", id: newMovement.id };
    }

    private async handleTransferRevert(tx: Prisma.TransactionClient, data: any, movement: any, ownerId: number) {
        if (!movement.destinationStoreId) {
            throw new ValidationError("InvalidTransferMovement");
        }

        const updateDest = await tx.product.updateMany({
            where: {
                sku: movement.product.sku,
                storeId: movement.destinationStoreId,
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

        await tx.product.update({
            where: { id: movement.productId },
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

        await this.finalizeRevert(tx, data, movement.id, null, ownerId);

        return { message: "TransferRevertedSuccessfully" };
    }

    private async finalizeRevert(tx: Prisma.TransactionClient, data: any, oldId: number, newId: number | null, ownerId: number) {
        await this.activityTracker.track({ tx, storeId: data.storeId });

        await this.auditLogService.create({
            action: "STOCK_REVERT",
            details: { originalId: oldId, revertId: newId },
            storeId: data.storeId,
            userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
            storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner: data.userType === 'OWNER'
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