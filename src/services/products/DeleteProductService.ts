import prismaClient from "../../prisma";
import { NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface DeleteProductRequest {
    performedByUserId: number;
    userType: string;
    userPermissions: string[];
    tokenStoreId?: number;
    storeId: number;
    productId: number;
    isGlobal: boolean;
    ipAddress: string;
    userAgent: string;
}

class DeleteProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: DeleteProductRequest) {
        return await prismaClient.$transaction(async (tx) => {
            const inventoryItem = await tx.storeInventory.findUnique({
                where: { 
                    storeId_productId: { storeId: data.storeId, productId: data.productId } 
                },
                include: { 
                    product: true,
                    store: { select: { ownerId: true } }
                }
            });

            if (!inventoryItem || inventoryItem.isDeleted) {
                throw new NotFoundError("ProductNotFoundInStore");
            }

            if (data.userType === 'OWNER' && inventoryItem.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }
            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const now = new Date();

            if (data.isGlobal) {
                const isOwner = data.userType === 'OWNER';
                const hasCatalogPerm = data.userPermissions.includes('DELETE_CATALOG') || data.userPermissions.includes('DELETE_PRODUCT');
                
                if (!isOwner && !hasCatalogPerm) {
                    throw new ForbiddenError("Você não tem permissão para excluir este produto do catálogo global.");
                }

                await tx.stockMoviment.updateMany({
                    where: { productId: data.productId, isDeleted: false },
                    data: { isDeleted: true, deletedAt: now }
                });

                await tx.storeInventory.updateMany({
                    where: { productId: data.productId, isDeleted: false },
                    data: { isDeleted: true, deletedAt: now }
                });

                await tx.productCatalog.update({
                    where: { id: data.productId },
                    data: { isDeleted: true, deletedAt: now }
                });

            } else {
                
                await tx.stockMoviment.updateMany({
                    where: { productId: data.productId, storeId: data.storeId, isDeleted: false },
                    data: { isDeleted: true, deletedAt: now }
                });

                await tx.storeInventory.update({
                    where: { id: inventoryItem.id },
                    data: { isDeleted: true, deletedAt: now }
                });
            }

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
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
                message: data.isGlobal ? "ProductDeletedGlobally" : "ProductRemovedFromStore", 
                deletedAt: now 
            };
        });
    }
}

export { DeleteProductService };