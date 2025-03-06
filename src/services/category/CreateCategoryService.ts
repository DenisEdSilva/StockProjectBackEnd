import prismaClient from "../../prisma";

interface CategoryRequest {
    name: string;
    storeId: number
}

class CreateCategoryService {
    async execute({ name, storeId }: CategoryRequest) { 
        try {
            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid category name");
            }

            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId
                }
            })

            if (!storeExists) {
                throw new Error("Store not found");
            }
    
            const categoryAlreadyExists = await prismaClient.category.findFirst({
                where: {
                    name: name,
                    storeId: storeId
                }
            })
    
            if (categoryAlreadyExists) {
                throw new Error("Category already exists");
            }
    
            const category = await prismaClient.category.create({
                data: {
                    name: name,
                    storeId: storeId
                },
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    createdAt: true
                }
            })
    
            return category;
        } catch (error) {
            console.log("Failed to create category. Error: ", error);
            throw new Error(`Failed to create category. Error: ${error.message}`);
        }
    }
}

export { CreateCategoryService }