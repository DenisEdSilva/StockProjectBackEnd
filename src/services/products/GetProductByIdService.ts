import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface GetProductRequest {
    storeId: number;
    id: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
}

class GetProductByIdService {
    async execute(data: GetProductRequest) {
        if (!Number.isInteger(data.id) || !Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidIdsProvided");
        }

        const inventoryItem = await prismaClient.storeInventory.findFirst({ 
            where: {
                productId: data.id,
                storeId: data.storeId,
                isDeleted: false,
                product: {
                    isDeleted: false
                }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        description: true,
                        banner: true,
                        categoryId: true,
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                store: {
                    select: {
                        ownerId: true
                    }
                }
            }
        });

        if (!inventoryItem) {
            throw new NotFoundError("ProductNotFoundInStore");
        }

        if (data.userType === 'OWNER' && inventoryItem.store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return {
            id: inventoryItem.product.id,
            storeInventoryId: inventoryItem.id,
            name: inventoryItem.product.name,
            price: inventoryItem.price,
            stock: inventoryItem.stock,
            banner: inventoryItem.product.banner,
            sku: inventoryItem.product.sku,
            description: inventoryItem.product.description,
            categoryId: inventoryItem.product.categoryId,
            category: inventoryItem.product.category,
        };
    }
}

export { GetProductByIdService };