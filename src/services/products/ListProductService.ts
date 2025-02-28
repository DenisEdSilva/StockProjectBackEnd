import prismaClient from "../../prisma";

interface ProductRequest {
    storeId: number,
    categoryId?: number
}

class ListProductService {
    async execute({ storeId, categoryId }: ProductRequest) {

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
                storeId: true
            }
        });

        return products;
    }
}

export { ListProductService }