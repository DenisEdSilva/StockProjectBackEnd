import prismaClient from "../../prisma";

interface CategoryRequest {
    storeId: string;
}

class ListCategoryService {
    async execute({ storeId }: CategoryRequest) {
        const categories = await prismaClient.category.findMany({
            where: {
                storeId: storeId
            },
            select: {
                id: true,
                name: true,
                storeId: true
            }
        });

        return categories;
    }
}

export { ListCategoryService };