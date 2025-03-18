import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface MovimentRequest {
    storeId: number;
    productId?: number;
}

class ListMovimentStockService {
    async execute({ storeId, productId }: MovimentRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

            const store = await tx.store.findUnique({ where: { id: storeId } });
            if (!store) throw new NotFoundError("Loja não encontrada");

            if (productId && isNaN(productId)) throw new ValidationError("ID do produto inválido");
            if (productId) {
                const product = await tx.product.findUnique({ where: { id: productId } });
                if (!product) throw new NotFoundError("Produto não encontrado");
            }

            return await tx.stockMoviment.findMany({
                where: { storeId, productId, isValid: true },
                select: {
                    id: true,
                    type: true,
                    stock: true,
                    product: { select: { name: true, banner: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        });
    }
}

export { ListMovimentStockService };