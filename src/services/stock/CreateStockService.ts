import { Prisma, StockMovimentType } from "@prisma/client";
import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface StockRequest {
    type: string;
    productId: number;
    productSKU: string;
    productName: string;
    stock: number;
    storeId: number;
    destinationStoreId?: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    ipAddress?: string;
    userAgent?: string;
}

interface OriginInventory {
    id: number;
    stock: number;
    price: Prisma.Decimal;
    product: {
        id: number;
        sku: string;
        name: string;
        isDeleted: boolean;
    };
}

class CreateStockService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: StockRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { 
                    id: data.storeId, 
                    isDeleted: false 
                },
                select: { 
                    id: true,
                    ownerId: true 
                }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            if (data.userType === 'OWNER' && data.performedByUserId !== store.ownerId) {
                throw new ForbiddenError("UnauthorizedStoreAccess");
            }

            const originInventory = await tx.storeInventory.findUnique({
                where: {
                    storeId_productId: {
                        storeId: data.storeId,
                        productId: data.productId
                    }
                },
                include: {
                    product: {
                        select: { id: true, sku: true, name: true, isDeleted: true }
                    }
                }
            });

            if (!originInventory || originInventory.isDeleted || originInventory.product.isDeleted) {
                throw new NotFoundError("ProductNotFoundInStoreInventory");
            }

            if (data.type === 'TRANSFER') {
                return await this.handleTransfer(tx, data, originInventory as OriginInventory, store.ownerId);
            }

            return await this.handleStandardMovement(tx, data, originInventory as OriginInventory, store.ownerId);
        });
    }

    private async handleTransfer(
        tx: Prisma.TransactionClient,
        data: StockRequest,
        originInventory: OriginInventory,
        ownerId: number
    ) {
        const destinationStore = await tx.store.findUnique({
            where: { 
                id: data.destinationStoreId, 
                isDeleted: false 
            },
            select: { 
                id: true, 
                ownerId: true 
            }
        });

        if (!destinationStore) throw new NotFoundError("DestinationStoreNotFound");
        if (destinationStore.ownerId !== ownerId) throw new ForbiddenError("UnauthorizedCrossOwnerTransfer");

        const updateOrigin = await tx.storeInventory.updateMany({
            where: {
                id: originInventory.id,
                stock: { gte: data.stock },
                isDeleted: false
            },
            data: { stock: { decrement: data.stock } }
        });

        if (updateOrigin.count === 0) throw new ConflictError("InsufficientStock");

        await tx.storeInventory.upsert({
            where: {
                storeId_productId: {
                    storeId: data.destinationStoreId!,
                    productId: data.productId
                }
            },
            update: {
                stock: { increment: data.stock },
                isDeleted: false
            },
            create: {
                productId: data.productId,
                storeId: data.destinationStoreId!,
                price: originInventory.price,
                stock: data.stock
            }
        });

        const movement = await tx.stockMoviment.create({
            data: {
                productId: data.productId,
                previousStock: originInventory.stock,
                stock: data.stock,
                type: StockMovimentType.TRANSFER,
                storeId: data.storeId,
                destinationStoreId: data.destinationStoreId,
                createdBy: data.performedByUserId
            }
        });

        await this.createAuditLog(tx, data, movement.id, ownerId);

        return movement;
    }

    private async handleStandardMovement(
        tx: Prisma.TransactionClient,
        data: StockRequest,
        originInventory: OriginInventory,
        ownerId: number
    ) {
        const isOut = data.type === 'OUT';

        const updated = await tx.storeInventory.updateMany({
            where: {
                id: originInventory.id,
                isDeleted: false,
                ...(isOut && { stock: { gte: data.stock } })
            },
            data: {
                stock: {
                    ...(isOut ? { decrement: data.stock } : { increment: data.stock })
                }
            }
        });

        if (updated.count === 0) {
            throw new ConflictError("InsufficientStock");
        }

        const stockMovement = await tx.stockMoviment.create({
            data: {
                productId: data.productId,
                previousStock: originInventory.stock,
                stock: data.stock,
                type: data.type as StockMovimentType,
                storeId: data.storeId,
                createdBy: data.performedByUserId
            }
        });

        await this.createAuditLog(tx, data, stockMovement.id, ownerId);

        return stockMovement;
    }

    private async createAuditLog(
        tx: Prisma.TransactionClient,
        data: StockRequest,
        movimentId: number,
        ownerId: number
    ) {
        const isOwnerUser = data.userType === 'OWNER';

        await this.activityTracker.track({
            tx,
            storeId: data.storeId,
            userId: data.userType === 'OWNER' ? data.performedByUserId : undefined
        });

        await this.auditLogService.create({
            action: data.type === 'TRANSFER' ? "STOCK_TRANSFER" : "STOCK_MOVIMENT_CREATE",
            ownerId: ownerId, 
            productId: data.productId,
            storeId: data.storeId,
            details: {
                movimentId,
                type: data.type,
                stock: data.stock,
                productId: data.productId,
                productSKU: data.productSKU,
                productName: data.productName,
                storeId: data.storeId,
                destinationStoreId: data.destinationStoreId
            },
            userId: isOwnerUser ? data.performedByUserId : undefined,
            storeUserId: !isOwnerUser ? data.performedByUserId : undefined,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner: isOwnerUser
        }, tx);
    }

    private validateInput(data: StockRequest) {
        if (!['IN', 'OUT', 'TRANSFER'].includes(data.type)) {
            throw new ValidationError("InvalidType");
        }
        if (!Number.isInteger(data.productId) || data.productId <= 0) {
            throw new ValidationError("InvalidProductId");
        }
        if (!Number.isInteger(data.storeId) || data.storeId <= 0) {
            throw new ValidationError("InvalidStoreId");
        }
        if (!Number.isInteger(data.stock) || !Number.isSafeInteger(data.stock) || data.stock <= 0) {
            throw new ValidationError("InvalidStock");
        }
        if (data.stock > 1_000_000) {
            throw new ValidationError("StockLimitExceeded");
        }
        if (!Number.isInteger(data.performedByUserId) || data.performedByUserId <= 0) {
            throw new ValidationError("InvalidUserId");
        }
        if (!['OWNER', 'STORE_USER'].includes(data.userType)) {
            throw new ValidationError("InvalidUserType");
        }
        if (data.type === 'TRANSFER') {
            if (!data.destinationStoreId || !Number.isInteger(data.destinationStoreId) || data.destinationStoreId <= 0) {
                throw new ValidationError("InvalidDestinationStoreId");
            }
            if (data.destinationStoreId === data.storeId) {
                throw new ValidationError("SameStoreTransferNotAllowed");
            }
        }
    }
}

export { CreateStockService };