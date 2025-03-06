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
        try {

            if (!banner || !name || !stock || !price || !description || !categoryId || !storeId) {
                throw new Error("All fields are required");
            }

            if (isNaN(stock) || stock <= 0) {
                throw new Error("Invalid stock value");
            }

            const priceNumber = parseFloat(price);
            if (isNaN(priceNumber)) {
                throw new Error("Invalid price format");
            }

            const categoryExists = await prismaClient.category.findUnique({
                where: {
                    id: categoryId
                }
            })

            if (!categoryExists) {
                throw new Error("Category not found");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId
                }
            })

            if (!storeExists) {
                throw new Error("Store not found");
            }

            const product = await prismaClient.product.create({
                data: {
                    banner: banner,
                    name: name,
                    stock,
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
                    storeId: true,
                    createdAt: true
                }
            })
    
            return product;

        } catch (error) {
            console.log("error creating product: ", error);
            throw new Error(`Failed to create product. Error: ${error.message}`);
        }
    }
}

export { CreateProductService }