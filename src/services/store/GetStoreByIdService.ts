import { ValidationError } from "../../errors";
import prismaClient from "../../prisma";

interface GetStoreRequest {
    ownerId: number;
    storeId: number;
}

class GetStoreByIdService {
    async execute(data: GetStoreRequest) {
        return await prismaClient.$transaction(async (tx) => {            
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }

            const store = await tx.store.findUnique({
                where: { 
                    id: data.storeId,
                    ownerId: data.ownerId
                },
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    createdAt: true,
                    ownerId: true,
                    _count: {
                        select: {
                            products: true,
                            categories: true,
                            storeUsers: true
                        }
                    }
                }
            })

            if (!store) {
                throw new ValidationError("Loja nao encontrada");
            }

            if (store.ownerId !== data.ownerId) {
                throw new ValidationError("Não foi possivel acessar a loja");
            }

            return store;
        })
    }
}

export { GetStoreByIdService };