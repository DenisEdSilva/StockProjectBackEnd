import prismaClient from "../../prisma";
import { ValidationError, ForbiddenError, NotFoundError } from "../../errors";
import { Prisma } from "@prisma/client";

import {
    ListProductRequest,
    ListProductResponse
} from "@/types/product/ListProduct.types";

import { mapToProductDTO } from "@/mappers/product/listProducts.mapper";

class ListProductService {
    async execute(data: ListProductRequest): Promise<ListProductResponse> {
        this.validateInput(data);

        return prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: {
                    id: data.storeId,
                    isDeleted: false
                },
                select: {
                    ownerId: true
                }
            });

            if (!store) throw new NotFoundError("StoreNotFound");

            this.validateAuthorization(data, store.ownerId);

            const where = this.buildWhere(data);

            const [items, total] = await Promise.all([
                tx.storeInventory.findMany({
                    where,
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
                    orderBy: this.buildOrderBy(data),
                    skip: (data.page - 1) * data.pageSize,
                    take: data.pageSize
                }),
                tx.storeInventory.count({ where })
            ]);

            return {
                data: items.map(mapToProductDTO),
                pagination: {
                    page: data.page,
                    pageSize: data.pageSize,
                    total,
                    totalPages: Math.ceil(total / data.pageSize)
                }
            };
        });
    }

    private buildWhere(data: ListProductRequest): Prisma.StoreInventoryWhereInput {
        return {
            storeId: data.storeId,
            isDeleted: false,

            ...(data.minStock !== undefined || data.maxStock !== undefined
                ? {
                      stock: {
                          ...(data.minStock !== undefined && { gte: data.minStock }),
                          ...(data.maxStock !== undefined && { lte: data.maxStock })
                      }
                  }
                : {}),

            ...(data.inStock !== undefined
                ? {
                      stock: data.inStock ? { gt: 0 } : { equals: 0 }
                  }
                : {}),

            ...(data.minPrice !== undefined || data.maxPrice !== undefined
                ? {
                      price: {
                          ...(data.minPrice !== undefined && { gte: data.minPrice }),
                          ...(data.maxPrice !== undefined && { lte: data.maxPrice })
                      }
                  }
                : {}),

            ...(data.startDate || data.endDate
                ? {
                      createdAt: {
                          ...(data.startDate && { gte: new Date(data.startDate) }),
                          ...(data.endDate && { lte: new Date(data.endDate) })
                      }
                  }
                : {}),

            product: {
                isDeleted: false,

                ...(data.productId && { id: data.productId }),

                ...(data.search && {
                    OR: [
                        { name: { contains: data.search, mode: "insensitive" } },
                        { sku: { contains: data.search, mode: "insensitive" } }
                    ]
                }),

                ...(data.sku && {
                    sku: { contains: data.sku, mode: "insensitive" }
                }),

                ...(data.categoryId && {
                    categoryId: data.categoryId
                })
            }
        };
    }

    private buildOrderBy(
        data: ListProductRequest
    ): Prisma.StoreInventoryOrderByWithRelationInput {
        const order = data.sortOrder || "asc";

        if (data.sortBy === "price") return { price: order };
        if (data.sortBy === "stock") return { stock: order };
        if (data.sortBy === "createdAt") return { createdAt: order };

        return {
            product: {
                name: order
            }
        };
    }

    private validateAuthorization(data: ListProductRequest, ownerId: number) {
        if (
            data.userType === "OWNER" &&
            ownerId !== data.performedByUserId
        ) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (
            data.userType === "STORE_USER" &&
            data.tokenStoreId !== data.storeId
        ) {
            throw new ForbiddenError("UnauthorizedAccess");
        }
    }

    private validateInput(data: ListProductRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        if (!Number.isInteger(data.page) || data.page <= 0) {
            throw new ValidationError("InvalidPage");
        }

        if (!Number.isInteger(data.pageSize) || data.pageSize <= 0) {
            throw new ValidationError("InvalidPageSize");
        }

        if (data.productId && !Number.isInteger(data.productId)) {
            throw new ValidationError("InvalidProductId");
        }

        if (data.categoryId && !Number.isInteger(data.categoryId)) {
            throw new ValidationError("InvalidCategoryId");
        }

        if (data.minStock !== undefined && !Number.isInteger(data.minStock)) {
            throw new ValidationError("InvalidMinStock");
        }

        if (data.maxStock !== undefined && !Number.isInteger(data.maxStock)) {
            throw new ValidationError("InvalidMaxStock");
        }

        if (data.minPrice !== undefined && !Number.isFinite(data.minPrice)) {
            throw new ValidationError("InvalidMinPrice");
        }

        if (data.maxPrice !== undefined && !Number.isFinite(data.maxPrice)) {
            throw new ValidationError("InvalidMaxPrice");
        }

        if (
            data.sortBy &&
            !["name", "stock", "price", "createdAt"].includes(data.sortBy)
        ) {
            throw new ValidationError("InvalidSortBy");
        }

        if (
            data.sortOrder &&
            !["asc", "desc"].includes(data.sortOrder)
        ) {
            throw new ValidationError("InvalidSortOrder");
        }
    }
}

export { ListProductService };