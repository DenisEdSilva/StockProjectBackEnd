import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface StockRequest {
    productId: number;
    type: 'entrada' | 'saida';
    stock: number;
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateStockService {
    private validateInput(data: StockRequest) {
        if (!['entrada', 'saida'].includes(data.type)) {
            throw new ValidationError("Tipo de movimentação inválido");
        }
        if (data.stock <= 0) throw new ValidationError("Quantidade deve ser maior que zero");
        if (!data.productId || isNaN(data.productId)) throw new ValidationError("ID do produto inválido");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("ID da loja inválido");
    }

    async execute(data: StockRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const [product, store] = await Promise.all([
                tx.product.findUnique({ where: { id: data.productId } }),
                tx.store.findUnique({ where: { id: data.storeId } })
            ]);

            if (!product) throw new NotFoundError("Produto não encontrado");
            if (!store) throw new NotFoundError("Loja não encontrada");
            if (data.type === 'saida' && product.stock < data.stock) {
                throw new ConflictError("Estoque insuficiente");
            }

            const stockMoviment = await tx.stockMoviment.create({
                data: {
                    productId: data.productId,
                    type: data.type,
                    stock: data.stock,
                    storeId: data.storeId
                }
            });

            await Promise.all([
                tx.stockMovimentStore.create({
                    data: { stockMovimentId: stockMoviment.id, storeId: data.storeId }
                }),
                tx.product.update({
                    where: { id: data.productId },
                    data: { stock: { increment: data.type === 'entrada' ? data.stock : -data.stock } }
                })
            ]);

            await tx.auditLog.create({
                data: {
                    action: "STOCK_MOVIMENT_CREATED",
                    details: JSON.stringify(stockMoviment),
                    userId: data.userId,
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return stockMoviment;
        });
    }
}

export { CreateStockService };