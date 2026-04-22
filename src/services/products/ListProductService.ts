import prismaClient from "../../prisma";
import { ValidationError, ForbiddenError, NotFoundError } from "../../errors";
import { Prisma } from "@prisma/client";

interface ListProductRequest {
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    search?: string;
    sku?: string;
    categoryId?: number;
    page: number;
    pageSize: number;
}

class ListProductService {
    async execute(data: ListProductRequest) {
        if (!Number.isInteger(data.storeId)) throw new ValidationError("InvalidStoreId");

        const store = await prismaClient.store.findUnique({
            where: { id: data.storeId, isDeleted: false },
            select: { ownerId: true }
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

        const whereClause: Prisma.StoreInventoryWhereInput = {
            storeId: data.storeId,
            isDeleted: false,
            product: {
                isDeleted: false,
                ...(data.search && {
                    name: { contains: data.search, mode: "insensitive" }
                }),
                ...(data.sku && {
                    sku: { contains: data.sku, mode: "insensitive" }
                }),
                ...(data.categoryId && { categoryId: Number(data.categoryId) })
            }
        };

        const [inventoryItems, total] = await Promise.all([
            prismaClient.storeInventory.findMany({
                where: whereClause,
                select: {
                    id: true,
                    price: true,
                    stock: true,
                    createdAt: true,
                    product: {
                        select: {
                            id: true,
                            sku: true,
                            name: true,
                            description: true,
                            banner: true,
                            category: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: { 
                    product: { 
                        name: 'asc' 
                    }
                },
                skip: (data.page - 1) * data.pageSize,
                take: data.pageSize
            }),
            prismaClient.storeInventory.count({ where: whereClause })
        ]);

        const formattedProducts = inventoryItems.map(item => ({
            id: item.product.id,
            storeInventoryId: item.id,
            name: item.product.name,
            price: item.price,
            stock: item.stock,
            banner: item.product.banner,
            sku: item.product.sku,
            description: item.product.description,
            category: item.product.category,
            createdAt: item.createdAt
        }));

        return {
            data: formattedProducts,
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total,
                totalPages: Math.ceil(total / data.pageSize)
            }
        };
    }
}

export { ListProductService };