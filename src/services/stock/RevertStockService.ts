import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface StockRequest {
    movementId: number;
    storeId: number;
    performedByUserId: number;
    ipAddress: string;
    userAgent: string;
}

class RevertStockService {
    async execute(data: StockRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        
        return await prismaClient.$transaction(async (tx) => {
            const storeOwner = await tx.store.findUnique({ 
                where: { id: data.storeId }, 
                select: { ownerId: true } 
            });

            if (!storeOwner) throw new NotFoundError("Loja não encontrada");
            
            const isOwner = data.performedByUserId === storeOwner.ownerId;

            if (!data.movementId || isNaN(data.movementId)) {
                throw new ValidationError("ID da movimentação inválido");
            }

            if (!data.performedByUserId) {
                throw new ValidationError("Usuário responsável não informado");
            }

            const wrongMovement = await tx.stockMoviment.findUnique({
                where: { id: data.movementId },
                include: { 
                    product: true,
                    store: true,
                    destinationStore: true
                }
            });

            if (!wrongMovement) throw new NotFoundError("Movimentação não encontrada");
            if (!wrongMovement.isValid) throw new ConflictError("Movimentação já revertida");
            if (!wrongMovement.product) throw new NotFoundError("Produto relacionado não encontrado");

            if (wrongMovement.type === 'transferencia') {
                return await this.handleTransferRevert(
                    tx, 
                    data, 
                    wrongMovement, 
                    auditLogService, 
                    activityTracker, 
                    isOwner
                );
            }

            return await this.handleStandardRevert(
                tx,
                data,
                wrongMovement,
                auditLogService,
                activityTracker,
                isOwner
            );
        });
    }

    private async handleStandardRevert(
        tx: any,
        data: StockRequest,
        wrongMovement: any,
        auditLogService: CreateAuditLogService,
        activityTracker: ActivityTracker,
        isOwner: boolean
    ) {
        const reverseType = wrongMovement.type === 'entrada' ? 'saida' : 'entrada';
        const reverseAmount = wrongMovement.type === 'entrada' ? -wrongMovement.stock : wrongMovement.stock;

        if (reverseType === 'saida' && wrongMovement.product.stock < wrongMovement.stock) {
            throw new ConflictError("Estoque insuficiente para reverter a movimentação");
        }

        const newMoviment = await tx.stockMoviment.create({
            data: {
                productId: wrongMovement.productId,
                type: reverseType,
                stock: wrongMovement.stock,
                storeId: wrongMovement.storeId,
                isValid: true,
                createdBy: data.performedByUserId
            }
        });

        await Promise.all([
            tx.product.update({
                where: { id: wrongMovement.productId },
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
        });

        await auditLogService.create({
            action: "STOCK_REVERT",
            details: {
                originalMovementId: wrongMovement.id,
                reverseMovementId: newMoviment.id,
                productId: wrongMovement.productId,
                amount: wrongMovement.stock,
                storeId: wrongMovement.storeId,
                type: wrongMovement.type
            },
            ...(isOwner ? { userId: data.performedByUserId } : { storeUserId: data.performedByUserId }),
            storeId: wrongMovement.storeId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });

        return { 
            message: "Movimentação revertida com sucesso",
            newStock: wrongMovement.product.stock + reverseAmount,
            reverseMovementId: newMoviment.id
        };
    }

    private async handleTransferRevert(
        tx: any,
        data: StockRequest,
        wrongMovement: any,
        auditLogService: CreateAuditLogService,
        activityTracker: ActivityTracker,
        isOwner: boolean
    ) {
        if (!wrongMovement.destinationStoreId) {
            throw new ValidationError("Movimentação de transferência sem loja de destino");
        }

        const relatedMoviment = await tx.stockMoviment.findFirst({
            where: {
                OR: [
                    { id: wrongMovement.relatedMovementId },
                    {
                        AND: [
                            { storeId: wrongMovement.destinationStoreId },
                            { productId: wrongMovement.productId },
                            { stock: wrongMovement.stock },
                            { createdAt: { gte: new Date(wrongMovement.createdAt.getTime() - 60000) } },
                            { createdAt: { lte: new Date(wrongMovement.createdAt.getTime() + 60000) } }
                        ]
                    }
                ]
            },
            include: {
                product: true
            }
        });

        if (!relatedMoviment) throw new NotFoundError("Movimentação relacionada não encontrada");
        if (!relatedMoviment.isValid) throw new ConflictError("Movimentação relacionada já revertida");

        const destinationProduct = await tx.product.findUnique({
            where: {
                id_storeId: {
                    id: wrongMovement.productId,
                    storeId: relatedMoviment.storeId
                }
            }
        });

        if (!destinationProduct) throw new NotFoundError("Produto não encontrado na loja de destino");
        if (destinationProduct.stock < relatedMoviment.stock) {
            throw new ConflictError("Estoque insuficiente na loja de destino para reverter");
        }

        await Promise.all([
            tx.stockMoviment.update({
                where: { id: wrongMovement.id },
                data: { isValid: false }
            }),
            tx.stockMoviment.update({
                where: { id: relatedMoviment.id },
                data: { isValid: false }
            }),

            tx.product.update({
                where: {
                    id_storeId: {
                        id: wrongMovement.productId,
                        storeId: wrongMovement.storeId
                    }
                },
                data: {
                    stock: {
                        increment: wrongMovement.stock
                    }
                }
            }),
            tx.product.update({
                where: {
                    id_storeId: {
                        id: wrongMovement.productId,
                        storeId: relatedMoviment.storeId
                    }
                },
                data: {
                    stock: {
                        decrement: relatedMoviment.stock
                    }
                }
            })
        ]);

        await activityTracker.track({
            tx,
            storeId: data.storeId,
            performedByUserId: data.performedByUserId
        });

        await auditLogService.create({
            action: "STOCK_TRANSFER_REVERT",
            details: {
                originalMovementId: wrongMovement.id,
                relatedMovementId: relatedMoviment.id,
                productId: wrongMovement.productId,
                amount: wrongMovement.stock,
                originStoreId: wrongMovement.storeId,
                destinationStoreId: relatedMoviment.storeId,
                originProductStock: wrongMovement.product.stock + wrongMovement.stock,
                destinationProductStock: destinationProduct.stock - relatedMoviment.stock
            },
            ...(isOwner ? { userId: data.performedByUserId } : { storeUserId: data.performedByUserId }),
            storeId: data.storeId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });

        return {
            message: "Transferência revertida com sucesso",
            originStock: wrongMovement.product.stock + wrongMovement.stock,
            destinationStock: destinationProduct.stock - relatedMoviment.stock,
            invalidatedMovements: [wrongMovement.id, relatedMoviment.id]
        };
    }
}

export { RevertStockService };