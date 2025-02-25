import prismaClient from "../../prisma";

interface ProductRequest {
    banner: string;
    name: string;
    price: string;
    categoryId: string;
}

class CreateProductService {
    async execute({ banner, name, price, categoryId }: ProductRequest) {
        const product = await prismaClient.product.create({
            data: {
                banner: banner,
                name: name,
                price: price,
                categoryId: categoryId
            },
            select: {
                id: true,
                banner: true,
                name: true,
                price: true,
                categoryId: true
            }
        })

        return product;
    }
}

export { CreateProductService }