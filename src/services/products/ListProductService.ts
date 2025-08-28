import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListProductRequest {
    storeId: number;
    search?: string;
    sku?: string;
    categoryId?: number;
    page?: number;
    pageSize?: number;
}

class ListProductService {
    async execute({ storeId, search, sku, categoryId, page = 1, pageSize = 10 }: ListProductRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

            const store = await tx.store.findUnique({ where: { id: storeId } });
            if (!store) throw new NotFoundError("Loja não encontrada");

            const whereClause = {
                storeId,
                isDeleted: false,
                ...(search && {
                    name: {
                        contains: search,
                        mode: "insensitive" as const
                    }
                }),
                ...(sku && {
                    sku: {
                        contains: sku,
                        mode: "insensitive" as const
                    }
                }),
                ...(categoryId && { categoryId: Number(categoryId) })
            };

            const [products, total] = await Promise.all([
                tx.product.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        stock: true,
                        banner: true,
                        sku: true,
                        categoryId: true,
                        category: { select: { name: true } },
                        createdAt: true,
                        updatedAt: true
                    },
                    orderBy: { name: 'asc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize
                }),
                tx.product.count({ where: whereClause })
            ]);

            return {
                data: products,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        });
    }
}

export { ListProductService };