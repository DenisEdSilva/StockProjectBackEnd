import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListCategoryRequest {
    storeId: number;
    search?: string;
    page?: number;
    pageSize?: number;
}

class ListCategoryService {
    async execute({ storeId, search, page = 1, pageSize = 10 }: ListCategoryRequest) {
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
                })
            };

            const [categories, total] = await Promise.all([
                tx.category.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        _count: { select: { products: { where: { isDeleted: false } } } }
                    },
                    orderBy: { name: 'asc' },
                    skip: (page - 1) * pageSize,
                    take: pageSize
                }),
                tx.category.count({ where: whereClause })
            ]);

            return {
                data: categories.map(cat => ({
                    ...cat,
                    productsCount: cat._count.products
                })),
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

export { ListCategoryService };