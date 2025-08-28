import prismaClient from "../../prisma";
import { UnauthorizedError, ValidationError } from "../../errors";

interface GetStoreRequest {
    userId: number;
    storeId: number;
}

class GetStoreByIdService {
    async execute(data: GetStoreRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.storeId || isNaN(data.storeId)) {
                throw new ValidationError("ID da loja inválido");
            }

            const storeAsOwner = await tx.store.findUnique({
                where: {
                    id: data.storeId,
                    ownerId: data.userId
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
            });

            if (storeAsOwner) {
                return storeAsOwner;
            }

            const storeUser = await tx.storeUser.findUnique({
                where: {
                    id: data.userId,
                    storeId: data.storeId,
                    isDeleted: false
                },
                include: {
                    store: {
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
                    }
                }
            });
            
            if (!storeUser?.store) {
                throw new UnauthorizedError("Acesso à loja não autorizado");
            }

            return storeUser.store;
        })
    }
}

export { GetStoreByIdService };