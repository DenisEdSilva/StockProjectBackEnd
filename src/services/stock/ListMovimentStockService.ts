import prismaClient from "../../prisma";

class ListMovimentStockService {
    async execute() {
        const moviment = await prismaClient.stockMoviment.findMany({
            select: {
                id: true,
                productId: true,
                type: true,
                quantity: true
            }
        });

        return moviment;
    }
}

export { ListMovimentStockService }