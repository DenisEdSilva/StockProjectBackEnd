import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListStoreRequest {
    ownerId: number;
}

class ListStoreService {
    async execute(data: ListStoreRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!data.ownerId || isNaN(data.ownerId)) {
                throw new ValidationError("ID do proprietário inválido");
            }

            const owner = await tx.user.findUnique({
                where: { id: data.ownerId },
                select: { id: true }
            });

            if (!owner) throw new NotFoundError("Proprietário não encontrado");

            return await tx.store.findMany({
                where: { 
                    ownerId: data.ownerId,
                    isDeleted: false
                },
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    _count: {
                        select: {
                            products: true,
                            categories: true,
                            storeUsers: true
                        }
                    }
                },
		        orderBy: {
                    name: 'asc'
                }
            });
        });
    }
}

export { ListStoreService };