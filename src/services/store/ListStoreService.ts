import prismaClient from "../../prisma";
import { ForbiddenError } from "../../errors";

class ListStoreService {
    async execute(data: any) {
        if (data.userType === 'STORE_USER') {
            if (!data.tokenStoreId) {
                throw new ForbiddenError("StoreContextMissing");
            }

            const store = await prismaClient.store.findUnique({
                where: { 
                    id: data.tokenStoreId, 
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
                            products: { where: { isDeleted: false } },
                            categories: { where: { isDeleted: false } },
                            storeUsers: { where: { isDeleted: false } }
                        }
                    }
                }
            });

            return store ? [store] : [];
        }

        return await prismaClient.store.findMany({
            where: { 
                ownerId: data.userId, 
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
                        products: { where: { isDeleted: false } },
                        categories: { where: { isDeleted: false } },
                        storeUsers: { where: { isDeleted: false } }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
    }
}

export { ListStoreService };