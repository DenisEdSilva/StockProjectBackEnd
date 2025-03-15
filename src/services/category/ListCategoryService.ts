import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

class ListCategoryService {
    async execute(storeId: number) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

            const store = await tx.store.findUnique({ where: { id: storeId } });
            if (!store) throw new NotFoundError("Loja não encontrada");

            const categories = await tx.category.findMany({
                where: { storeId, isDeleted: false },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    _count: { select: { products: { where: { isDeleted: false } } } }
                },
                orderBy: { name: 'asc' }
            });

            return categories.map(cat => ({
                ...cat,
                productsCount: cat._count.products
            }));
        });
    }
}

export { ListCategoryService };