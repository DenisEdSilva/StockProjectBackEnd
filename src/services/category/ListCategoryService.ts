import prismaClient from "../../prisma";
import { Prisma } from "@prisma/client";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface ListCategoryRequest {
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'name' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    minProducts?: number;
    maxProducts?: number;
    page: number;
    pageSize: number;
}

class ListCategoryService {
    async execute(data: ListCategoryRequest) {
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

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            this.validateAuthorization(data, store.ownerId);

            const whereBase = this.buildWhereBase(data);

            const categories = await tx.category.findMany({
                where: whereBase,
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    createdAt: true,
                    _count: {
                        select: {
                            products: {
                                where: {
                                    isDeleted: false
                                }
                            }
                        }
                    }
                }
            });

            const filtered = categories.filter((category) => {
                if (
                    data.minProducts !== undefined &&
                    category._count.products < data.minProducts
                ) {
                    return false;
                }

                if (
                    data.maxProducts !== undefined &&
                    category._count.products > data.maxProducts
                ) {
                    return false;
                }

                return true;
            });

            const sorted = filtered.sort((a, b) => {
                const field = data.sortBy || "name";
                const order = data.sortOrder === "desc" ? -1 : 1;

                if (field === "createdAt") {
                    return (
                        (new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()) * order
                    );
                }

                return a.name.localeCompare(b.name) * order;
            });

            const total = sorted.length;

            const paginated = sorted.slice(
                (data.page - 1) * data.pageSize,
                data.page * data.pageSize
            );

            return {
                data: paginated.map((category) => ({
                    id: category.id,
                    name: category.name,
                    storeId: category.storeId,
                    createdAt: category.createdAt,
                    productsCount: category._count.products
                })),
                pagination: {
                    page: data.page,
                    pageSize: data.pageSize,
                    total,
                    totalPages: Math.ceil(total / data.pageSize)
                }
            };
        });
    }

    private validateInput(data: ListCategoryRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        if (!Number.isInteger(data.page) || data.page <= 0) {
            throw new ValidationError("InvalidPage");
        }

        if (!Number.isInteger(data.pageSize) || data.pageSize <= 0) {
            throw new ValidationError("InvalidPageSize");
        }

        if (
            data.minProducts !== undefined &&
            !Number.isInteger(data.minProducts)
        ) {
            throw new ValidationError("InvalidMinProducts");
        }

        if (
            data.maxProducts !== undefined &&
            !Number.isInteger(data.maxProducts)
        ) {
            throw new ValidationError("InvalidMaxProducts");
        }

        if (
            data.minProducts !== undefined &&
            data.maxProducts !== undefined &&
            data.minProducts > data.maxProducts
        ) {
            throw new ValidationError("InvalidProductsRange");
        }

        if (
            data.sortBy &&
            !["name", "createdAt"].includes(data.sortBy)
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

    private validateAuthorization(
        data: ListCategoryRequest,
        ownerId: number
    ) {
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

    private buildWhereBase(
        data: ListCategoryRequest
    ): Prisma.CategoryWhereInput {
        return {
            storeId: data.storeId,
            isDeleted: false,
            ...(data.search && {
                name: {
                    contains: data.search,
                    mode: "insensitive"
                }
            }),
            ...(data.startDate || data.endDate
                ? {
                      createdAt: {
                          ...(data.startDate && {
                              gte: new Date(data.startDate)
                          }),
                          ...(data.endDate && {
                              lte: new Date(data.endDate)
                          })
                      }
                  }
                : {})
        };
    }
}

export { ListCategoryService };