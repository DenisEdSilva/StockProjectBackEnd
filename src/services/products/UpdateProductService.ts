import prismaClient from "../../prisma";

interface ProductRequest {
    id: number;
    banner?: string;
    name?: string;
    price?: string;
    description?: string;
    categoryId?: number;
}

class UpdateProductService {
    async execute({ id, banner, name, price, description, categoryId }: ProductRequest) {
        try {
            if (!id) {
                throw new Error("Product ID is required");
            }

            if (!banner && !name && !price && !description && !categoryId) {
                throw new Error("At least one field must be updated");
            }

            const productExists = await prismaClient.product.findUnique({
                where: {
                    id: id
                }
            });

            if (!productExists) {
                throw new Error("Product not found");
            }

            if (categoryId) {
                const categoryExists = await prismaClient.category.findUnique({
                    where: {
                        id: categoryId
                    }
                });

                if (!categoryExists) {
                    throw new Error("Category not found");
                }
            }

            const product = await prismaClient.product.update({
                where: {
                    id: id
                },
                data: {
                    banner: banner,
                    name: name,
                    price: price,
                    description: description,
                    categoryId: categoryId
                },
                select: {
                    id: true,
                    banner: true,
                    name: true,
                    stock: true,
                    price: true,
                    description: true,
                    categoryId: true,
                    storeId: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            return product;
        } catch (error) {
            console.error("Error on update product: ", error);
            throw new Error(`Failed to update product. Error: ${error.message}`);
        }
    }
}

export { UpdateProductService };