import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface GetProductByIdRequest {
    storeId: number;
    id: number;
}

class GetProductByIdService {
    async execute(data: GetProductByIdRequest) {
        return await prismaClient.$transaction(async (tx) => {

            if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("ID da loja inválido");
            
            if (!data.id || isNaN(data.id)) throw new ValidationError("ID do produto inválido");


            const store = await tx.store.findUnique({ where: { 
                id: data.storeId,
                isDeleted: false
            }});
        
            if (!store) throw new NotFoundError("Loja nao encontrada");

            const product = await tx.product.findUnique({ 
                where: {
                    id: data.id,
                    storeId: data.storeId,
                    isDeleted: false
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    stock: true,
                    banner: true,
                    sku: true,
                    categoryId: true,
                    createdAt: true,
                    category: { select: { name: true } }
                }
            });

            if (!product) throw new NotFoundError("Produto nao encontrado");

            return product
        })
    }
}

export { GetProductByIdService }