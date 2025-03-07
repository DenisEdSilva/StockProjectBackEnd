import prismaClient from "../../prisma";

interface DeleteCategoryRequest {
    id: number;
}

class DeleteCategoryService {
    async execute({ id }: DeleteCategoryRequest) {
        try {
            if (!id) {
                throw new Error("Category ID is required");
            }

            const categoryExists = await prismaClient.category.findUnique({
                where: {
                    id: id
                },
                include: {
                    products: true
                }
            });

            if (!categoryExists) {
                throw new Error("Category not found");
            }

            if (categoryExists.products && categoryExists.products.length > 0) {
                for (const product of categoryExists.products) {
                    await prismaClient.stockMoviment.deleteMany({
                        where: {
                            productId: product.id
                        }
                    });

                    await prismaClient.product.delete({
                        where: {
                            id: product.id
                        }
                    });
                }
            }

            await prismaClient.category.delete({
                where: {
                    id: id
                }
            });

            return { message: "Category and related products deleted successfully" };
        } catch (error) {
            console.error("Error on delete category: ", error);
            throw new Error(`Failed to delete category. Error: ${error.message}`);
        }
    }
}

export { DeleteCategoryService };