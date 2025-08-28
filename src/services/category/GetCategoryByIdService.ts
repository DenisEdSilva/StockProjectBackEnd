import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface categoryByIdrequest {
    storeId: number,
    id: number
}

export class GetCategoryByIdService {
    async execute( data: categoryByIdrequest ) {
        return await prismaClient.$transaction(async (tx) => {

            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }

            if (!data.id || isNaN(data.id)) {
                throw new ValidationError("ID da categoria inválido");
            }

            const category = await tx.category.findUnique({ 
                where: { 
                    storeId: data.storeId,
                    id: data.id,
                    isDeleted: false
                },
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!category) throw new NotFoundError("Categoria nao encontrada");

            return category
        })
    }

}

export default new GetCategoryByIdService();