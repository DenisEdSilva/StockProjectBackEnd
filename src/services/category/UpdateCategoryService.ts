import prismaClient from "../../prisma";

interface UpdateCategoryRequest {
    id: number;
    name?: string;
}

class UpdateCategoryService {
    async execute({ id, name }: UpdateCategoryRequest) {
        try {
            if (!id) {
                throw new Error("Category ID is required");
            }

            if (!name) {
                throw new Error("Name is required for update");
            }

            const categoryExists = await prismaClient.category.findUnique({
                where: {
                    id: id
                }
            });

            if (!categoryExists) {
                throw new Error("Category not found");
            }

            const updatedCategory = await prismaClient.category.update({
                where: {
                    id: id
                },
                data: {
                    name: name
                },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            return updatedCategory;
        } catch (error) {
            console.error("Error on update category: ", error);
            throw new Error(`Failed to update category. Error: ${error.message}`);
        }
    }
}

export { UpdateCategoryService };