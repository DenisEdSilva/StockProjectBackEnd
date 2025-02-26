import prismaClient from "../../prisma";

interface ProductRequest {
    banner: string;
    name: string;
    price: string;
    categoryId: string;
    storeId: string
}

class CreateProductService {
    async execute({ banner, name, price, categoryId, storeId }: ProductRequest) {
        const product = await prismaClient.product.create({
            data: {
                banner: banner,
                name: name,
                price: price,
                categoryId: categoryId,
                storeId: storeId
            },
            select: {
                id: true,
                banner: true,
                name: true,
                price: true,
                categoryId: true,
                storeId: true
            }
        })

        return product;
    }
}

export { CreateProductService }