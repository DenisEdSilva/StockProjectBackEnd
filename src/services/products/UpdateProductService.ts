import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { Prisma } from "@prisma/client";

interface UpdateProductRequest {
    productId: number;
    storeId: number;
    name?: string;
    price?: Prisma.Decimal | string;
    description?: string;
    categoryId?: number;
    sku?: string;
    banner?: string;
    performedByUserId: number;
    userType: string;
    userPermissions?: string[];
    tokenStoreId?: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: UpdateProductRequest) {
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
                    store: { 
                        select: { 
                            ownerId: true 
                        } 
                    }
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

            const updateInventoryData: any = {};
            const updateCatalogData: any = {};

            if (data.price !== undefined) updateInventoryData.price = data.price;

            if (data.name !== undefined) updateCatalogData.name = data.name;
            if (data.description !== undefined) updateCatalogData.description = data.description;
            if (data.banner !== undefined) updateCatalogData.banner = data.banner;
            
            const isTryingToUpdateCatalog = Object.keys(updateCatalogData).length > 0 || data.categoryId || data.sku;
            
            if (isTryingToUpdateCatalog) {
                const isOwner = data.userType === 'OWNER';
                const hasCatalogPerm = data.userPermissions?.includes('PUT_CATALOG') || data.userPermissions?.includes('PUT_PRODUCT'); 
                
                if (!isOwner && !hasCatalogPerm) {
                    throw new ForbiddenError("Você não tem permissão para alterar os dados globais deste produto na matriz.");
                }
            }

            if (data.categoryId) {
                const category = await tx.category.findFirst({
                    where: { id: data.categoryId, storeId: data.storeId, isDeleted: false }
                });
                if (!category) throw new NotFoundError("CategoryNotFoundInThisStore");
                updateCatalogData.categoryId = data.categoryId;
            }

            if (data.sku) {
                const normalizedSku = this.normalizeSku(data.sku);
                const existingSku = await tx.productCatalog.findUnique({
                    where: { 
                        ownerId_sku: { 
                            ownerId: inventoryItem.store.ownerId, 
                            sku: normalizedSku 
                        } 
                    }
                });

                if (existingSku && existingSku.id !== data.productId) {
                    throw new ConflictError("SKUAlreadyExistsInCatalog");
                }
                updateCatalogData.sku = normalizedSku;
            }

            let updatedPrice = inventoryItem.price;
            if (Object.keys(updateInventoryData).length > 0) {
                const updatedInv = await tx.storeInventory.update({
                    where: { id: inventoryItem.id },
                    data: updateInventoryData
                });
                updatedPrice = updatedInv.price;
            }

            let updatedCatalog = inventoryItem.product;
            if (Object.keys(updateCatalogData).length > 0) {
                updatedCatalog = await tx.productCatalog.update({
                    where: { id: data.productId },
                    data: updateCatalogData
                });
            }

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "PRODUCT_UPDATE",
                ownerId: inventoryItem.store.ownerId,
                productId: data.productId,
                details: { 
                    old: { 
                        name: inventoryItem.product.name, 
                        price: inventoryItem.price,
                        sku: inventoryItem.product.sku
                    }, 
                    new: { 
                        name: updatedCatalog.name, 
                        price: updatedPrice,
                        sku: updatedCatalog.sku
                    } 
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return {
                ...updatedCatalog,
                price: updatedPrice,
                stock: inventoryItem.stock,
                storeInventoryId: inventoryItem.id
            };
        });
    }

    private normalizeSku(sku: string): string {
        return sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    }

    private validateInput(data: UpdateProductRequest) {
        if (data.price !== undefined) {
            const priceValue = Number(data.price);
            if (isNaN(priceValue) || priceValue < 0) {
                 throw new ValidationError("InvalidPriceFormat");
            }
        }
    }
}

export { UpdateProductService };