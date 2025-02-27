import prismaClient from "../../prisma";

interface ProductRequest {
    banner: string;
    name: string;
    stock: number;
    price: string;
    description: string
    categoryId: number;
    storeId: number
}

class CreateProductService {
    async execute({ banner, name, stock, price, description, categoryId, storeId }: ProductRequest) {
        const product = await prismaClient.product.create({
            data: {
                banner: banner,
                name: name,
                stock: stock,
                price: price,
                description: description,
                categoryId: categoryId,
                storeId: storeId
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
        })

        return product;
    }
}

export { CreateProductService }