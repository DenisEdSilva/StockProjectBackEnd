import prismaClient from "../../prisma";
import {
    ValidationError,
    NotFoundError,
    ConflictError,
    ForbiddenError
} from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { Prisma } from "@prisma/client";
import {
    UpdateProductRequest,
    UpdateProductResponse
} from "@/types/product/UpdateProduct.types";
import { mapToUpdateProductResponse } from "@/mappers/product/updateProduct.mapper";

class UpdateProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: UpdateProductRequest): Promise<UpdateProductResponse> {
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

            const {
                updateInventoryData,
                updateCatalogData,
                shouldUpdateCatalog
            } = this.buildUpdatePayload(data);

            if (shouldUpdateCatalog) {
                this.validateCatalogPermission(data);
            }

            await this.handleCategoryUpdate(tx, data);
            await this.handleSkuUpdate(tx, data, inventoryItem);

            const updatedInventory = await this.updateInventory(
                tx,
                inventoryItem,
                updateInventoryData
            );

            const updatedCatalog = await this.updateCatalog(
                tx,
                inventoryItem,
                updateCatalogData
            );

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                ownerId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined
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
                        price: updatedInventory.price,
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

            return mapToUpdateProductResponse({
                product: updatedCatalog,
                price: updatedInventory.price,
                stock: inventoryItem.stock,
                storeInventoryId: inventoryItem.id
            });
        });
    }


    private buildUpdatePayload(data: UpdateProductRequest) {
        const updateInventoryData: Prisma.StoreInventoryUpdateInput = {};
        const updateCatalogData: Prisma.ProductCatalogUpdateInput = {};

        if (data.price !== undefined) {
            updateInventoryData.price = new Prisma.Decimal(data.price);
        }

        if (data.name !== undefined) updateCatalogData.name = data.name;
        if (data.description !== undefined) updateCatalogData.description = data.description;
        if (data.banner !== undefined) updateCatalogData.banner = data.banner;

        const shouldUpdateCatalog =
            Object.keys(updateCatalogData).length > 0 ||
            data.categoryId !== undefined ||
            data.sku !== undefined;

        return {
            updateInventoryData,
            updateCatalogData,
            shouldUpdateCatalog
        };
    }

    private validateInput(data: UpdateProductRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        if (!Number.isInteger(data.productId)) {
            throw new ValidationError("InvalidProductId");
        }

        if (data.price !== undefined) {
            const priceValue = Number(data.price);
            if (isNaN(priceValue) || priceValue < 0) {
                throw new ValidationError("InvalidPriceFormat");
            }
        }
    }

    private validateAuthorization(
        data: UpdateProductRequest,
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

    private validateCatalogPermission(data: UpdateProductRequest) {
        const isOwner = data.userType === 'OWNER';

        const hasPermission =
            data.userPermissions?.includes('PUT_CATALOG') ||
            data.userPermissions?.includes('PUT_INVENTORY');

        if (!isOwner && !hasPermission) {
            throw new ForbiddenError(
                "No permission to update global product data"
            );
        }
    }

    private async handleCategoryUpdate(tx: any, data: UpdateProductRequest) {
        if (!data.categoryId) return;

        const category = await tx.category.findFirst({
            where: {
                id: data.categoryId,
                storeId: data.storeId,
                isDeleted: false
            }
        });

        if (!category) {
            throw new NotFoundError("CategoryNotFoundInThisStore");
        }
    }

    private async handleSkuUpdate(
        tx: any,
        data: UpdateProductRequest,
        inventoryItem: any
    ) {
        if (!data.sku) return;

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

        data.sku = normalizedSku;
    }

    private async updateInventory(
        tx: any,
        inventoryItem: any,
        data: Prisma.StoreInventoryUpdateInput
    ) {
        if (Object.keys(data).length === 0) {
            return inventoryItem;
        }

        return await tx.storeInventory.update({
            where: { id: inventoryItem.id },
            data
        });
    }

    private async updateCatalog(
        tx: any,
        inventoryItem: any,
        data: Prisma.ProductCatalogUpdateInput
    ) {
        if (Object.keys(data).length === 0) {
            return inventoryItem.product;
        }

        return await tx.productCatalog.update({
            where: { id: inventoryItem.product.id },
            data
        });
    }

    private normalizeSku(sku: string): string {
        return sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    }
}

export { UpdateProductService };