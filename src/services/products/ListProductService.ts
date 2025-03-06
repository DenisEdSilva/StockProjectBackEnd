import prismaClient from "../../prisma";

interface ProductRequest {
    storeId: number,
    categoryId?: number
}

class ListProductService {
    async execute({ storeId, categoryId }: ProductRequest) {
        try {
            if (!storeId) {
                throw new Error("Store ID is required");
            }
    
            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId
                }
            })

            if (!storeExists) {
                throw new Error("Store not found");
            }  

            if (categoryId) {
                const categoryExists = await prismaClient.category.findUnique({
                    where: {
                        id: categoryId
                    }
                })
    
                if (!categoryExists) {
                    throw new Error("Category not found");
                }
            }
    
            const products = await prismaClient.product.findMany({
                where: {
                    storeId: storeId,
                    ...(categoryId && { categoryId })
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
                    createdAt: true
                }
            });
    
            return products;
        } catch (error) {
            console.log("Error on list products: ", error);
            throw new Error(`Failed to list products. Error: ${error.message}`);
        }
    }
}

export { ListProductService }