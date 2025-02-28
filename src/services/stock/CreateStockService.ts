import prismaClient from "../../prisma";

interface StockRequest {
    productId: number;
    type: string;
    stock: number;
    storeId: number
}

class CreateStockService {
    async execute({ productId, type, stock, storeId }: StockRequest) {
        if (type !== 'entrada' && type !== 'saida') {
            throw new Error('Tipo de movimentacao invalido');
        }

        const currentStock = await prismaClient.product.findUnique({
            where: {
                id: productId
            },
            select: {
                stock: true
            }
        })

        if (type === 'saida' && currentStock.stock < stock) {
            throw new Error('Estoque insuficiente para concluir esta operação');
        }

       const stockMoviment = await prismaClient.stockMoviment.create({
            data: {
                productId: productId,
                type: type,
                stock: stock,
                storeId: storeId
            },
            select: {
                id: true,
                productId: true,
                stock: true,
                storeId: true
            }
       })

       const stockMovimentStore = await prismaClient.stockMovimentStore.create({
            data: {
                stockMovimentId: stockMoviment.id,
                storeId: storeId
            },
            select: {
                id: true,
                stockMovimentId: true,
                storeId: true
            }
       })
       
       const stockUpdate = await prismaClient.product.update({
            where: {
                id: productId
            },
            data: {
                stock: { 
                    increment: type === 'entrada' ? stock : -stock, 
                }
            },
            select: {
                id: true,
                name: true,
                stock: true,
                price: true,
                description: true,
                banner: true,
                storeId: true
            }
       })

        return { stockMoviment, stockMovimentStore, stockUpdate };
    }
}

export { CreateStockService }