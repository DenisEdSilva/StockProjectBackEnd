import prismaClient from "../../prisma";

interface CategoryRequest {
    name: string;
    storeId: number
}

class CreateCategoryService {
    async execute({ name, storeId }: CategoryRequest) { 
        if (name === "" || name === null) {
            throw new Error("Invalid name");
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
                name: true
            }
        })

        return category;
    }
}

export { CreateCategoryService }