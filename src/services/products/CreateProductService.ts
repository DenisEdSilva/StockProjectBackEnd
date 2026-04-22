import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { Prisma } from "@prisma/client";

interface ProductRequest {
    banner: string;
    name: string;
    price: string | number;
    description: string;
    sku?: string;
    categoryId: number;
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    ipAddress: string;
    userAgent: string;
}

class CreateProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: ProductRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { 
                    id: data.storeId, 
                    isDeleted: false 
                },
                select: { 
                    id: true, 
                    name: true, 
                    ownerId: true 
                }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const category = await tx.category.findFirst({
                where: { 
                    id: data.categoryId, 
                    storeId: data.storeId, 
                    isDeleted: false
                },
                select: { 
                    id: true, 
                    name: true 
                }
            });

            if (!category) {
                throw new NotFoundError("CategoryNotFoundInThisStore");
            }

            const finalSku = data.sku 
                ? this.normalizeSku(data.sku) 
                : await this.generateGenericSmartSku(category.name, data.name);

            let catalogProduct = await tx.productCatalog.findUnique({
                where: {
                    ownerId_sku: {
                        sku: finalSku,
                        ownerId: store.ownerId,
                    }
                }
            });

            if (!catalogProduct) {
                catalogProduct = await tx.productCatalog.create({
                    data: {
                        sku: finalSku,
                        name: data.name,
                        description: data.description,
                        banner: data.banner,
                        ownerId: store.ownerId,
                        categoryId: data.categoryId
                    }
                });
            } else if (catalogProduct.isDeleted) {
                catalogProduct = await tx.productCatalog.update({
                    where: { 
                        id: catalogProduct.id 
                    },
                    data: { 
                        isDeleted: false,
                        name: data.name,
                        categoryId: data.categoryId 
                    }
                });
            }

            const existingInventory = await tx.storeInventory.findUnique({
                where: {
                    storeId_productId: {
                        storeId: data.storeId,
                        productId: catalogProduct.id
                    }
                }
            });

            if (existingInventory && !existingInventory.isDeleted) {
                throw new ConflictError("ProductAlreadyInStoreInventory");
            }

            const inventoryItem = await tx.storeInventory.upsert({
                where: {
                    storeId_productId: {
                        storeId: data.storeId,
                        productId: catalogProduct.id
                    }
                },
                update: {
                    price: new Prisma.Decimal(data.price),
                    isDeleted: false
                },
                create: {
                    productId: catalogProduct.id,
                    storeId: data.storeId,
                    price: new Prisma.Decimal(data.price),
                    stock: 0
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: existingInventory ? "PRODUCT_CATALOG_LINK" : "PRODUCT_CREATE",
                details: { 
                    productId: catalogProduct.id, 
                    sku: finalSku, 
                    name: catalogProduct.name,
                    price: data.price
                },
                storeId: data.storeId,
                ownerId: store.ownerId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return {
                ...catalogProduct,
                price: inventoryItem.price,
                storeInventoryId: inventoryItem.id
            };
        });
    }

    private normalizeSku(sku: string): string {
        return sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    }

    private async generateGenericSmartSku(categoryName: string, productName: string): Promise<string> {
        const catPart = categoryName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
        const namePart = productName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase().padEnd(4, 'X');
        const hashPart = Math.random().toString(36).substring(2, 6).toUpperCase();

        return `${catPart}-${namePart}-${hashPart}`;
    }

    private validateInput(data: ProductRequest) {
        if (!data.name?.trim() || data.name.length < 3) {
            throw new ValidationError("InvalidProductName");
        }
        const priceValue = Number(data.price);
        if (isNaN(priceValue) || priceValue <= 0) {
            throw new ValidationError("InvalidPrice");
        }
        
        if (!data.categoryId) {
            throw new ValidationError("CategoryRequired");
        }
        if (!data.storeId) {
            throw new ValidationError("StoreRequired");
        }
    }
}

export { CreateProductService };