import { Prisma, StockMovimentType } from "@prisma/client";
import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface StockRequest {
    type: string;
    productId: number;
    stock: number;
    storeId: number;
    destinationStoreId?: number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    ipAddress?: string;
    userAgent?: string;
}

interface OriginProduct {
    id: number;
    sku: string;
    name: string;
    description: string;
    price: Prisma.Decimal;
    banner: string;
    stock: number;
    category: { name: string };
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

            if (data.userType === 'OWNER') {
                if (data.performedByUserId !== store.ownerId) {
                    throw new ForbiddenError("UnauthorizedStoreAccess");
                }
            }

            const originProduct = await tx.product.findUnique({
                where: {
                    id: data.productId,
                    storeId: data.storeId,
                    isDeleted: false
                },
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    description: true,
                    price: true,
                    banner: true,
                    stock: true,
                    category: { select: { name: true } }
                }
            });

            if (!originProduct) {
                throw new NotFoundError("ProductNotFound");
            }

            if (data.type === 'TRANSFER') {
                return await this.handleTransfer(tx, data, originProduct, store.ownerId);
            }

            return await this.handleStandardMovement(tx, data, originProduct);
        });
    }

    private async handleTransfer(
    tx: Prisma.TransactionClient,
    data: StockRequest,
    originProduct: OriginProduct,
    ownerId: number
) {
    const destinationStore = await tx.store.findUnique({
        where: { id: data.destinationStoreId, isDeleted: false },
        select: { id: true, ownerId: true }
    });

    if (!destinationStore) throw new NotFoundError("DestinationStoreNotFound");
    if (destinationStore.ownerId !== ownerId) throw new ForbiddenError("UnauthorizedCrossOwnerTransfer");

    const destinationProduct = await tx.product.upsert({
        where: {
            sku_storeId: {
                sku: originProduct.sku,
                storeId: data.destinationStoreId!
            }
        },
        update: {},
        create: {
            sku: originProduct.sku,
            name: originProduct.name,
            banner: originProduct.banner,
            description: originProduct.description,
            price: originProduct.price,
            stock: 0,
            store: {
                connect: {
                    id: data.destinationStoreId!
                }
            },
            category: {
                connectOrCreate: {
                    where: { 
                        name_storeId: { 
                            name: originProduct.category.name, 
                            storeId: data.destinationStoreId! 
                        } 
                    },
                    create: { 
                        name: originProduct.category.name, 
                        storeId: data.destinationStoreId! 
                    }
                }
            }
        }
    });

    const updateOrigin = await tx.product.updateMany({
        where: {
            id: data.productId,
            stock: { gte: data.stock },
            isDeleted: false
        },
        data: { stock: { decrement: data.stock } }
    });

    if (updateOrigin.count === 0) throw new ConflictError("InsufficientStock");

    await tx.product.update({
        where: { id: destinationProduct.id },
        data: { stock: { increment: data.stock } }
    });

    const movement = await tx.stockMoviment.create({
        data: {
            productId: data.productId,
            previousStock: originProduct.stock,
            stock: data.stock,
            type: StockMovimentType.TRANSFER,
            storeId: data.storeId,
            destinationStoreId: data.destinationStoreId,
            createdBy: data.performedByUserId
        }
    });

    await this.createAuditLog(tx, data, movement.id);

    return movement;
}

    private async handleStandardMovement(
        tx: Prisma.TransactionClient,
        data: StockRequest,
        originProduct: OriginProduct
    ) {
        const isOut = data.type === 'OUT';

        const updated = await tx.product.updateMany({
            where: {
                id: data.productId,
                storeId: data.storeId,
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
                previousStock: originProduct.stock,
                stock: data.stock,
                type: data.type as StockMovimentType,
                storeId: data.storeId,
                createdBy: data.performedByUserId
            }
        });

        await this.createAuditLog(tx, data, stockMovement.id);

        return stockMovement;
    }

    private async createAuditLog(
        tx: Prisma.TransactionClient,
        data: StockRequest,
        movimentId: number
    ) {
        const isOwnerUser = data.userType === 'OWNER';

        await this.activityTracker.track({
            tx,
            storeId: data.storeId,
            userId: data.userType === 'OWNER' ? data.performedByUserId : undefined
        });

        await this.auditLogService.create({
            action: "STOCK_MOVIMENT_CREATE",
            details: {
                movimentId,
                type: data.type,
                stock: data.stock,
                productId: data.productId,
                storeId: data.storeId,
                destinationStoreId: data.destinationStoreId
            },
            userId: isOwnerUser ? data.performedByUserId : undefined,
            storeUserId: !isOwnerUser ? data.performedByUserId : undefined,
            storeId: data.storeId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
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