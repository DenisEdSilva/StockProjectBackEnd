import prismaClient from "../../prisma";

interface CategoryRequest {
    name: string;
    storeId: number
}

class CreateCategoryService {
    async execute({ name, storeId }: CategoryRequest) {
        
        if (name === "") {
            throw new Error("Invalid name");
        }

        const category = await prismaClient.category.create({
            data: {
                name: name,
                storeId: storeId
            },
            select: {
                id: true,
                name: true
            }
        })

        return category;
    }
}

export { CreateCategoryService }