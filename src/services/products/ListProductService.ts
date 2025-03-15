import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListProductRequest {
    storeId: number;
    categoryId?: number;
}

class ListProductService {
    async execute({ storeId, categoryId }: ListProductRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

            const store = await tx.store.findUnique({ where: { id: storeId } });
            if (!store) throw new NotFoundError("Loja não encontrada");

            if (categoryId) {
                const category = await tx.category.findUnique({ where: { id: categoryId } });
                if (!category) throw new NotFoundError("Categoria não existe");
            }

            return await tx.product.findMany({
                where: { 
                    storeId,
                    categoryId,
                    isDeleted: false
                },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    stock: true,
                    banner: true,
                    categoryId: true,
                    createdAt: true,
                    category: { select: { name: true } }
                }
            });
        });
    }
}

export { ListProductService };