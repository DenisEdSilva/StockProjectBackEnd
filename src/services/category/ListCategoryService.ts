import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface ListCategoryRequest {
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    search?: string;
    page: number;
    pageSize: number;
}

class ListCategoryService {
    async execute(data: ListCategoryRequest) {
        if (!Number.isInteger(data.storeId)) throw new ValidationError("InvalidStoreId");

        const store = await prismaClient.store.findUnique({
            where: { id: data.storeId, isDeleted: false },
            select: { ownerId: true }
        });

        if (!store) throw new NotFoundError("StoreNotFound");

        if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        const whereClause = {
            storeId: data.storeId,
            isDeleted: false,
            ...(data.search && {
                name: {
                    contains: data.search,
                    mode: "insensitive" as const
                }
            })
        };

        const [categories, total] = await Promise.all([
            prismaClient.category.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    _count: { 
                        select: { products: { where: { isDeleted: false } } } 
                    }
                },
                orderBy: { name: 'asc' },
                skip: (data.page - 1) * data.pageSize,
                take: data.pageSize
            }),
            prismaClient.category.count({ where: whereClause })
        ]);

        return {
            data: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                createdAt: cat.createdAt,
                productsCount: cat._count.products
            })),
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total,
                totalPages: Math.ceil(total / data.pageSize)
            }
        };
    }
}

export { ListCategoryService };