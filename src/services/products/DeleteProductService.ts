import prismaClient from "../../prisma";

interface DeleteProductRequest {
    id: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteProductService {
    async execute({ id, userId, ipAddress, userAgent }: DeleteProductRequest) {
        try {
            if (!id) {
                throw new Error("Product ID is required");
            }

            const productExists = await prismaClient.product.findUnique({
                where: {
                    id: id,
                },
                include: {
                    stockMoviment: true,
                },
            });

            if (!productExists) {
                throw new Error("Product not found");
            }

            if (productExists.stockMoviment && productExists.stockMoviment.length > 0) {
                for (const moviment of productExists.stockMoviment) {
                    await prismaClient.stockMovimentStore.updateMany({
                        where: {
                            stockMovimentId: moviment.id,
                        },
                        data: {
                            isDeleted: true,
                            deletedAt: new Date(),
                        },
                    });

                    await prismaClient.stockMoviment.update({
                        where: {
                            id: moviment.id,
                        },
                        data: {
                            isDeleted: true,
                            deletedAt: new Date(),
                        },
                    });
                }
            }

            const deletedProduct = await prismaClient.product.update({
                where: {
                    id: id,
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "DELETE_PRODUCT",
                    details: JSON.stringify({
                        productId: id,
                        deletedAt: new Date(),
                        relatedStockMoviments: productExists.stockMoviment.map((mov) => mov.id),
                    }),
                    userId: userId,
                    storeId: productExists.storeId,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            });

            return { message: "Product and related stock movements marked as deleted successfully" };
        } catch (error) {
            console.error("Error on delete product: ", error);
            throw new Error(`Failed to delete product. Error: ${error.message}`);
        }
    }
}

export { DeleteProductService };