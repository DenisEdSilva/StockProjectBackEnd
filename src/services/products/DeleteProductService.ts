import prismaClient from "../../prisma";
import { NotFoundError, ForbiddenError, ValidationError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import {
    DeleteProductRequest,
    DeleteProductResponse
} from "@/types/product/DeleteProduct.types";

class DeleteProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: DeleteProductRequest): Promise<DeleteProductResponse> {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const inventoryItem = await tx.storeInventory.findUnique({
                where: {
                    storeId_productId: {
                        storeId: data.storeId,
                        productId: data.productId
                    }
                },
                include: {
                    product: true,
                    store: { select: { ownerId: true } }
                }
            });

            if (!inventoryItem || inventoryItem.isDeleted) {
                throw new NotFoundError("ProductNotFoundInStore");
            }

            this.validateAuthorization(data, inventoryItem.store.ownerId);

            const now = new Date();

            if (data.isGlobal) {
                await this.handleGlobalDelete(tx, data, inventoryItem, now);
            } else {
                await this.handleLocalDelete(tx, data, inventoryItem, now);
            }

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                ownerId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined
            });

            await this.auditLogService.create({
                action: data.isGlobal ? "PRODUCT_DELETE_GLOBAL" : "PRODUCT_DELETE_LOCAL",
                ownerId: inventoryItem.store.ownerId,
                productId: data.productId,
                details: {
                    productId: data.productId,
                    name: inventoryItem.product.name,
                    sku: inventoryItem.product.sku,
                    scope: data.isGlobal ? "ALL_STORES" : `STORE_${data.storeId}`
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return {
                message: data.isGlobal
                    ? "ProductDeletedGlobally"
                    : "ProductRemovedFromStore",
                deletedAt: now
            };
        });
    }

    private validateInput(data: DeleteProductRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        if (!Number.isInteger(data.productId)) {
            throw new ValidationError("InvalidProductId");
        }

        if (!Array.isArray(data.userPermissions)) {
            throw new ValidationError("InvalidPermissions");
        }
    }

    private validateAuthorization(
        data: DeleteProductRequest,
        ownerId: number
    ) {
        if (
            data.userType === 'OWNER' &&
            ownerId !== data.performedByUserId
        ) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (
            data.userType === 'STORE_USER' &&
            data.tokenStoreId !== data.storeId
        ) {
            throw new ForbiddenError("UnauthorizedAccess");
        }
    }

    private async handleGlobalDelete(
        tx: any,
        data: DeleteProductRequest,
        inventoryItem: any,
        now: Date
    ) {
        const isOwner = data.userType === 'OWNER';

        const hasPermission =
            data.userPermissions.includes('DELETE_CATALOG') ||
            data.userPermissions.includes('DELETE_INVENTORY');

        if (!isOwner && !hasPermission) {
            throw new ForbiddenError(
                "You do not have permission to delete this product globally"
            );
        }

        await tx.stockMoviment.updateMany({
            where: {
                productId: data.productId,
                isDeleted: false
            },
            data: {
                isDeleted: true,
                deletedAt: now
            }
        });

        await tx.storeInventory.updateMany({
            where: {
                productId: data.productId,
                isDeleted: false
            },
            data: {
                isDeleted: true,
                deletedAt: now
            }
        });

        await tx.productCatalog.update({
            where: { id: data.productId },
            data: {
                isDeleted: true,
                deletedAt: now
            }
        });
    }

    private async handleLocalDelete(
        tx: any,
        data: DeleteProductRequest,
        inventoryItem: any,
        now: Date
    ) {
        await tx.stockMoviment.updateMany({
            where: {
                productId: data.productId,
                storeId: data.storeId,
                isDeleted: false
            },
            data: {
                isDeleted: true,
                deletedAt: now
            }
        });

        await tx.storeInventory.update({
            where: { id: inventoryItem.id },
            data: {
                isDeleted: true,
                deletedAt: now
            }
        });
    }
}

export { DeleteProductService };