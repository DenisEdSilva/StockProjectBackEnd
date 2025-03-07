import prismaClient from "../../prisma";

interface CategoryRequest {
    storeId: number;
}

class ListCategoryService {
    async execute({ storeId }: CategoryRequest) {
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

            const categories = await prismaClient.category.findMany({
                where: {
                    storeId: storeId
                },
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    createdAt: true
                },
                orderBy: {
                    name: "asc"
                }
            });
    
            return {
                count: categories.length,
                categories: categories
            };
        } catch (error) {
            console.log("Failed on listing categories: ", error);
            throw new Error(`Failed on listing categories. Error: ${error}`);
        }
    }
}

export { ListCategoryService };