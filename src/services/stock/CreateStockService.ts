import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface StockRequest {
    type: 'entrada' | 'saida' | 'transferencia';
    productId: number;
    stock: number;
    storeId: number;
    destinationStoreId?: number
    performedByUserId?: number;
    ipAddress?: string;
    userAgent?: string;
}

class CreateStockService {
    async execute(data: StockRequest) {
        console.log('[CreateStockService] Dados recebidos:', data);
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const isOwner = await tx.store.findUnique({ 
                where: { 
                    id: data.storeId 
                }, 
                select: { 
                    ownerId: true 
                } 
            });

            console.log("[CreateStockService] isOwner:", isOwner)
            
            const store = await tx.store.findUnique({ 
                where: { 
                    id: data.storeId 
                } 
            })
            
            if (!store) throw new NotFoundError("Loja não encontrada");

            console.log("[CreateStockService] store:", store)
            
            const product = await tx.product.findUnique({
                where: {
                    id: data.productId,
                    storeId: data.storeId,
                    isDeleted: false
                },
                select: {
                    sku: true,
                    categoryId: true
                }
            })

            const originProduct = await tx.product.findUnique({
                where: {
                    sku_storeId:{
                        sku: product.sku,
                        storeId: data.storeId,
                    },
                    isDeleted: false
                },
                select: {
                    sku: true,
                    name: true,
                    description: true,
                    price: true,
                    banner: true,
                    stock: true,
                    category: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            console.log("[CreateStockService] originProduct:", originProduct)

            if (!originProduct) throw new NotFoundError("Produto nao encontrado na loja de origem");

            console.log(data.type)

            if (data.type === 'transferencia') {
                console.log('[CreateStockService - handleTransfer] Transferência iniciada');
                return await this.handleTransfer(tx, data, originProduct, auditLogService, activityTracker, isOwner);
            }

            console.log('[CreateStockService - handleStandardMovement] Movimento padrão iniciado');
            return await this.handleStandardMovement(tx, data, originProduct, auditLogService, activityTracker, isOwner);
        });
    }

    private async handleTransfer(
        tx: any,
        data: StockRequest,
        originProduct: { 
            sku: string,
            name: string,
            description: string,
            price: string,
            banner: string,
            stock: number,
            category: { name: string }
        },
        auditLogService: CreateAuditLogService,
        activityTracker: ActivityTracker,
        isOwner: any
    ) {
        console.log('[CreateStockService - handleTransfer] Transferência iniciada');
        if (!data.destinationStoreId) throw new ValidationError("Loja de destino obrigatória");
        if (!data.destinationStoreId) console.log("Loja de destino obrigatória");
        if (originProduct.stock < data.stock) throw new ConflictError("Estoque insuficiente para transferencia");
        if (originProduct.stock < data.stock) console.log("Estoque insuficiente para transferencia");

        const destinationStore = await tx.store.findUnique({
            where: {
                id: data.destinationStoreId
            }
        });

        console.log('[CreateStockService - handleTransfer] destinationStore:', destinationStore);

        if (!destinationStore) throw new NotFoundError("Loja de destino nao encontrada");

        let destinationProduct = await tx.product.findUnique({
            where: {
                sku_storeId: {
                    sku: originProduct.sku,
                    storeId: data.destinationStoreId
                }
            }
        });

        console.log('[CreateStockService - handleTransfer] destinationProduct:', destinationProduct);

        if (!destinationProduct) {
            console.log('[CreateStockService - handleTransfer] destinationProduct not found, creating...');
            console.log('[CreateStockService - handleTransfer] finding category:', originProduct.category.name, "na loja: ", data.destinationStoreId);
            let destinationCategory = await tx.category.findFirst({
                where: {
                    name: originProduct.category.name,
                    storeId: data.destinationStoreId
                }
            });

            console.log('[CreateStockService - handleTransfer] destinationCategory:', destinationCategory);            
            if (!destinationCategory) {
                console.log('[CreateStockService - handleTransfer] destinationCategory not found, creating...');
                destinationCategory = await tx.category.create({
                    data: {
                        name: originProduct.category.name,
                        storeId: data.destinationStoreId
                    }
                });
            }

            console.log('[CreateStockService - handleTransfer] destinationCategory:', destinationCategory);
            
            console.log('[CreateStockService - handleTransfer] creating destinationProduct...');
            try {
                destinationProduct = await tx.product.create({
                    data: {
                        banner: originProduct.banner,
                        name: originProduct.name,
                        stock: 0,
                        price: originProduct.price,
                        description: originProduct.description,
                        storeId: data.destinationStoreId,
                        categoryId: destinationCategory.id,
                        sku: originProduct.sku
                    }
                });

                console.log('[CreateStockService - handleTransfer] destinationProduct created:', destinationProduct);
            } catch (error) {
                console.log('[CreateStockService - handleTransfer] error creating destinationProduct:', error);
                throw new ConflictError("Erro ao criar produto na loja de destino");
            }
        }

        console.log('[CreateStockService - handleTransfer] creating outboundMoviment...');
        const outboundMoviment = await tx.stockMoviment.create({
            data: {
                productId: data.productId,
                stock: data.stock,
                type: 'transferencia',
                storeId: data.storeId,
                createdBy: data.performedByUserId,
                destinationStoreId: data.destinationStoreId
            }
        });

        console.log('[CreateStockService - handleTransfer] outboundMoviment created:', outboundMoviment);

        await Promise.all([
            console.log('[CreateStockService - handleTransfer] decrementing originProduct stock...'),
            tx.product.update({
                where: {
                    id: data.productId,
                    storeId: data.storeId
                },
                data: {
                    stock: {
                        decrement: data.stock
                    }
                }
            }),

            console.log('[CreateStockService - handleTransfer] incrementing destinationProduct stock...'),
            tx.product.update({
                where: {
                    id: destinationProduct.id,
                    storeId: data.destinationStoreId
                },
                data: {
                    stock: {
                        increment: data.stock
                    }
                }
            })
        ])


        console.log('[CreateStockService - handleTransfer] creating audit log...');
        await this.createAuditLog(auditLogService, activityTracker, {
            ...data,
            movimentId: outboundMoviment.id,
            destinationStoreId: data.destinationStoreId
        }, isOwner, tx);

        console.log('[CreateStockService - handleTransfer] audit log created')

        return outboundMoviment;
    }

    private async handleStandardMovement(
        tx: any,
        data: StockRequest,
        product: { stock: number },
        auditLogService: CreateAuditLogService,
        activityTracker: ActivityTracker,
        isOwner: any
    ) {
        console.log('[CreateStockService - handleStandardMovement] Movimento padrão:', data.type);
        if (data.type === 'saida' && product.stock < data.stock) {
            throw new ConflictError("Estoque insuficiente");
        }

        console.log('[CreateStockService - handleStandardMovement] Criando movimento...');
        const stockMovement = await tx.stockMoviment.create({
            data: {
                type: data.type,
                stock: data.stock,
                productId: data.productId,
                storeId: data.storeId,
                createdBy: data.performedByUserId,
                destinationStoreId: null
            }
        });

        console.log('[CreateStockService - handleStandardMovement] Movimento criado:', stockMovement);

        console.log('[CreateStockService - handleStandardMovement] Atualizando estoque...');
        await tx.product.update({
            where: {
                id: data.productId,
                storeId: data.storeId
            },
            data: {
                stock: {
                    increment: data.type === 'entrada' ? data.stock : -data.stock
                }
            }
        });
        console.log('[CreateStockService - handleStandardMovement] Estoque atualizado');

        console.log('[CreateStockService - handleStandardMovement] Criando audit log...');
        await this.createAuditLog(auditLogService, activityTracker, {
            ...data,
            movimentId: stockMovement.id
        }, isOwner, tx);

        console.log('[CreateStockService - handleStandardMovement] Audit log criado');
        return stockMovement;

    }

    private async createAuditLog(
        auditLogService: CreateAuditLogService,
        activityTracker: ActivityTracker,
        data: StockRequest & { movimentId: number },
        isOwnerData: { ownerId: number},
        tx: any
    ) {
        
        const isOwner = isOwnerData && data.performedByUserId === isOwnerData.ownerId;

        const logIdentity = isOwner
        ? { userId: data.performedByUserId }
        : { storeUserId: data.performedByUserId };
        console.log('[DEBUG] logIdentity:', logIdentity);

        console.log('[CreateStockService] Criando ActivityTracker...');
        await activityTracker.track({
            tx,
            storeId: data.storeId,
            performedByUserId: data.performedByUserId
        });
        console.log('[CreateStockService] ActivityTracker criado');

        console.log('[CreateStockService] Criando audit log...');
        try {
            await auditLogService.create({
                action: "STOCK_MOVIMENT_CREATE",
                details: {
                    type: data.type,
                    stock: data.stock,
                    productId: data.productId,
                    storeId: data.storeId,
                    ...(data.type === 'transferencia' && {
                        destinationStoreId: data.destinationStoreId
                    })
                },
                ...logIdentity,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            });
            console.log('[CreateStockService] Audit log criado com sucesso');
        } catch (error) {
            console.log('[CreateStockService] Erro ao criar audit log:', error);
            throw error
        }
    }

    private validateInput(data: StockRequest) {
        console.log('[CreateStockService] Validando dados:', data);
        console.log('[CreateStockService] type valid:', data.type);
        if (!['entrada', 'saida', 'transferencia'].includes(data.type)) {
            throw new ValidationError("Tipo de movimentação inválido");
        }
        console.log('[CreateStockService] stock valid:', data.stock);
        if (data.stock <= 0) throw new ValidationError("Quantidade inválida");
        console.log('[CreateStockService] productId valid:', data.productId);
        if (data.type === 'transferencia' && !data.destinationStoreId) {
            throw new ValidationError("Loja destino obrigatória");
        }
    }
}

export { CreateStockService };