import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface StockRequest {
    wrongMovimentId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class RevertStockService {
    async execute(data: StockRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.wrongMovimentId || isNaN(data.wrongMovimentId)) {
                throw new ValidationError("ID da movimentação inválido");
            }

            const wrongMoviment = await tx.stockMoviment.findUnique({
                where: { id: data.wrongMovimentId },
                include: { product: true }
            });

            if (!wrongMoviment) throw new NotFoundError("Movimentação não encontrada");
            if (!wrongMoviment.isValid) throw new ConflictError("Movimentação já revertida");
            if (!wrongMoviment.product) throw new NotFoundError("Produto relacionado não encontrado");

            const reverseType = wrongMoviment.type === 'entrada' ? 'saida' : 'entrada';
            const reverseAmount = wrongMoviment.type === 'entrada' ? -wrongMoviment.stock : wrongMoviment.stock;

            const newMoviment = await tx.stockMoviment.create({
                data: {
                    productId: wrongMoviment.productId,
                    type: reverseType,
                    stock: wrongMoviment.stock,
                    storeId: wrongMoviment.storeId,
                    isValid: true
                }
            });

            await Promise.all([
                tx.product.update({
                    where: { id: wrongMoviment.productId },
                    data: { stock: { increment: reverseAmount } }
                }),
                tx.stockMoviment.update({
                    where: { id: data.wrongMovimentId },
                    data: { isValid: false }
                })
            ]);

            await tx.auditLog.create({
                data: {
                    action: "STOCK_REVERTED",
                    details: JSON.stringify({
                        originalMoviment: data.wrongMovimentId,
                        newMoviment: newMoviment.id
                    }),
                    userId: data.userId,
                    storeId: wrongMoviment.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return { 
                message: "Movimentação revertida com sucesso",
                newStock: wrongMoviment.product.stock + reverseAmount
            };
        });
    }
}

export { RevertStockService };