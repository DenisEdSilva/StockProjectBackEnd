import prismaClient from "../../prisma";
import { ValidationError, ForbiddenError, NotFoundError } from "../../errors";

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

        const whereClause = {
            storeId: data.storeId,
            isDeleted: false,
            ...(data.search && {
                name: { contains: data.search, mode: "insensitive" as const }
            }),
            ...(data.sku && {
                sku: { contains: data.sku, mode: "insensitive" as const }
            }),
            ...(data.categoryId && { categoryId: Number(data.categoryId) })
        };

        const [products, total] = await Promise.all([
            prismaClient.product.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    stock: true,
                    banner: true,
                    sku: true,
                    description: true,
                    category: { 
                        select: { 
                            id: true,
                            name: true 
                        } 
                    },
                    createdAt: true
                },
                orderBy: { name: 'asc' },
                skip: (data.page - 1) * data.pageSize,
                take: data.pageSize
            }),
            prismaClient.product.count({ where: whereClause })
        ]);

        return {
            data: products,
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