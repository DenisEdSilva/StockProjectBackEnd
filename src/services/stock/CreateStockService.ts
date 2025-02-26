import prismaClient from "../../prisma";

interface StockRequest {
    productId: string;
    type: string;
    quantity: number;
    storeId: string
}

class CreateStockService {
    async execute({ productId, type, quantity, storeId }: StockRequest) {
        const stock = await prismaClient.productQuantity.create({
            data: {
                productId: productId,
                quantity: quantity,
                storeId: storeId
            },
            select: {
                id: true,
                productId: true,
                quantity: true,
                storeId: true
            }
       })

       const stockMoviment = await prismaClient.stockMoviment.create({
            data: {
                productId: productId,
                type: type,
                quantity: quantity,
                storeId: storeId
            },
            select: {
                id: true,
                productId: true,
                quantity: true,
                storeId: true
            }
       })

        return { stock, stockMoviment };
    }
}

export { CreateStockService }