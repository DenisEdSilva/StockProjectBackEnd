import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface StockRequest {
    productId: number;
    type: 'entrada' | 'saida';
    stock: number;
    storeId: number;
    performedByUserId: number;
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
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const isOwner = await tx.store.findUnique({ where: { id: data.storeId }, select: { ownerId: true } });

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
                }),
            ]);

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.performedByUserId
            })

            await auditLogService.create({
                action: "STOCK_MOVIMENT_CREATE",
                details: {
                    type: data.type,
                    stock: data.stock,
                    productId: data.productId,
                    storeId: data.storeId
                },
                ...(isOwner ? {
                    userId: data.performedByUserId
                } : {
                    storeUserId: data.performedByUserId
                }),
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            return stockMoviment;
        });
    }
}

export { CreateStockService };