import prismaClient from "../../prisma";

interface MovimentRequest {
    storeId: number;
    productId?: number;
}

class ListMovimentStockService {
    async execute({ storeId, productId }: MovimentRequest) {
        try {
            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            if (productId) {
                const productExists = await prismaClient.product.findUnique({
                    where: {
                        id: productId,
                    },
                });

                if (!productExists) {
                    throw new Error("Product not found");
                }
            }

            const moviment = await prismaClient.stockMoviment.findMany({
                where: {
                    storeId: storeId,
                    ...(productId && { productId }),
                },
                select: {
                    id: true,
                    productId: true,
                    type: true,
                    stock: true,
                    storeId: true,
                    isValid: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return moviment;
        } catch (err) {
            console.error("Error listing stock movements:", err);
            throw new Error(`Failed to list stock movements. Error: ${err.message}`);
        }
    }
}

export { ListMovimentStockService };