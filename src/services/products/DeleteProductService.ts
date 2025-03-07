import prismaClient from "../../prisma";

interface DeleteProductRequest {
    id: number; // ID do produto a ser deletado
}

class DeleteProductService {
    async execute({ id }: DeleteProductRequest) {
        try {
            if (!id) {
                throw new Error("Product ID is required");
            }

            const productExists = await prismaClient.product.findUnique({
                where: {
                    id: id
                },
                include: {
                    stockMoviment: true
                }
            });

            if (!productExists) {
                throw new Error("Product not found");
            }

            if (productExists.stockMoviment && productExists.stockMoviment.length > 0) {
                for (const moviment of productExists.stockMoviment) {
                    await prismaClient.stockMovimentStore.deleteMany({
                        where: {
                            stockMovimentId: moviment.id
                        }
                    });

                    await prismaClient.stockMoviment.delete({
                        where: {
                            id: moviment.id
                        }
                    });
                }
            }

            await prismaClient.product.delete({
                where: {
                    id: id
                }
            });

            return { message: "Product and related stock movements deleted successfully" };
        } catch (error) {
            console.error("Error on delete product: ", error);
            throw new Error(`Failed to delete product. Error: ${error.message}`);
        }
    }
}

export { DeleteProductService };