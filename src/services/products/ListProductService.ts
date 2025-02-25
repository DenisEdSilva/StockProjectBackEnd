import prismaClient from "../../prisma";

class ListProductService {
    async execute() {
        const products = await prismaClient.product.findMany({
            select: {
                id: true,
                banner: true,
                name: true,
                price: true,
                categoryId: true
            }
        });

        return products;
    }
}

export { ListProductService }