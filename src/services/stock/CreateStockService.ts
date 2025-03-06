import prismaClient from "../../prisma";

interface StockRequest {
    productId: number;
    type: string;
    stock: number;
    storeId: number;
}

class CreateStockService {
    async execute({ productId, type, stock, storeId }: StockRequest) {
        try {
            if (type !== "entrada" && type !== "saida") {
                throw new Error("Invalid movement type. Use 'entrada' or 'saida'.");
            }

            const product = await prismaClient.product.findUnique({
                where: {
                    id: productId,
                },
            });

            if (!product) {
                throw new Error("Product not found");
            }

            const store = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!store) {
                throw new Error("Store not found");
            }

            if (type === "saida" && product.stock < stock) {
                throw new Error("Insufficient stock to complete this operation");
            }

            const result = await prismaClient.$transaction(async (prisma) => {
                const stockMoviment = await prisma.stockMoviment.create({
                    data: {
                        productId: productId,
                        type: type,
                        stock: stock,
                        storeId: storeId,
                    },
                });

                const stockMovimentStore = await prisma.stockMovimentStore.create({
                    data: {
                        stockMovimentId: stockMoviment.id,
                        storeId: storeId,
                    },
                });

                const updatedProduct = await prisma.product.update({
                    where: {
                        id: productId,
                    },
                    data: {
                        stock: {
                            increment: type === "entrada" ? stock : -stock,
                        },
                    },
                });

                return {
                    stockMoviment,
                    stockMovimentStore,
                    updatedProduct,
                };
            });

            return result;
        } catch (err) {
            console.error("Error creating stock movement:", err);
            throw new Error(`Failed to create stock movement. Error: ${err.message}`);
        }
    }
}

export { CreateStockService };