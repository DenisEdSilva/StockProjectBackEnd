import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface StockRequest {
    movementId: number;
    storeId: number;
    productId: number;
    performedByUserId: number;
    ipAddress: string;
    userAgent: string;
}

class RevertStockService {
    async execute(data: StockRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            const isOwner = await tx.store.findUnique({ 
                where: { 
                    id: data.storeId 
                }, select: { 
                    ownerId: true 
                } 
            });

            if (!data.movementId || isNaN(data.movementId)) {
                throw new ValidationError("ID da movimentação inválido");
            }

            const wrongMoviment = await tx.stockMoviment.findUnique({
                where: { id: data.movementId },
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
                    where: { id: data.movementId },
                    data: { isValid: false }
                })
            ]);

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.performedByUserId
            })

            const oldData = JSON.stringify(wrongMoviment, null, 2);
            const newData = JSON.stringify(newMoviment, null, 2);

            await auditLogService.create({
                action: "STOCK_REVERT",
                details: {
                    oldData,
                    newData
                },
                ...(isOwner ? {
                    userId: data.performedByUserId
                } : {
                    storeUserId: data.performedByUserId
                }),
                storeId: wrongMoviment.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            return { 
                message: "Movimentação revertida com sucesso",
                newStock: wrongMoviment.product.stock + reverseAmount
            };
        });
    }
}

export { RevertStockService };