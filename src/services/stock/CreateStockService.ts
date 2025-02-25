import prismaClient from "../../prisma";

interface StockRequest {
    productId: string;
    type: string;
    quantity: number;
}

class CreateStockService {
    async execute({ productId, type, quantity }: StockRequest) {
        const stock = await prismaClient.productQuantity.create({
            data: {
                productId: productId,
                quantity: quantity
            },
            select: {
                id: true,
                productId: true,
                quantity: true
            }
       })

       const stockMoviment = await prismaClient.stockMoviment.create({
            data: {
                productId: productId,
                type: type,
                quantity: quantity
            },
            select: {
                id: true,
                productId: true,
                quantity: true
            }
       })

        return { stock, stockMoviment };
    }
}

export { CreateStockService }