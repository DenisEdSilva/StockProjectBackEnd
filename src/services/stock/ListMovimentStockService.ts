import prismaClient from "../../prisma";

interface MovimentRequest {
    storeId: string;
    productId?: string
}

class ListMovimentStockService {
    async execute({ storeId, productId }: MovimentRequest) {
        const moviment = await prismaClient.stockMoviment.findMany({
            where: {
                storeId: storeId,
                ...(productId && { productId })
            },
            select: {
                id: true,
                productId: true,
                type: true,
                quantity: true,
                storeId: true
            }
        });

        return moviment;
    }
}

export { ListMovimentStockService }