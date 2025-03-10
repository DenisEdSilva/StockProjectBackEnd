import prismaClient from "../../prisma";

interface DeleteCategoryRequest {
    id: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteCategoryService {
    async execute({ id, userId, ipAddress, userAgent }: DeleteCategoryRequest) {
        try {
            if (!id) {
                throw new Error("Category ID is required");
            }

            const categoryExists = await prismaClient.category.findUnique({
                where: {
                    id: id,
                },
                include: {
                    products: {
                        include: {
                            stockMoviment: true,
                        },
                    },
                },
            });

            if (!categoryExists) {
                throw new Error("Category not found");
            }

            if (categoryExists.products && categoryExists.products.length > 0) {
                for (const product of categoryExists.products) {
                    if (product.stockMoviment && product.stockMoviment.length > 0) {
                        for (const moviment of product.stockMoviment) {
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

                    await prismaClient.product.update({
                        where: {
                            id: product.id,
                        },
                        data: {
                            isDeleted: true,
                            deletedAt: new Date(),
                        },
                    });
                }
            }

            const deletedCategory = await prismaClient.category.update({
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
                    action: "DELETE_CATEGORY",
                    details: JSON.stringify({
                        categoryId: id,
                        deletedAt: new Date(),
                        relatedProducts: categoryExists.products.map((prod) => prod.id),
                    }),
                    userId: userId,
                    storeId: categoryExists.storeId,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            });

            return { message: "Category and related products marked as deleted successfully" };
        } catch (error) {
            console.error("Error on delete category: ", error);
            throw new Error(`Failed to delete category. Error: ${error.message}`);
        }
    }
}

export { DeleteCategoryService };