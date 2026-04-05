import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

class GetStoreByIdService {
    async execute(data: any) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        const store = await prismaClient.store.findUnique({
            where: { 
                id: data.storeId, 
                isDeleted: false 
            },
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
                zipCode: true,
                ownerId: true,
                _count: {
                    select: {
                        products: { where: { isDeleted: false } },
                        categories: { where: { isDeleted: false } },
                        storeUsers: { where: { isDeleted: false } }
                    }
                }
            }
        });

        if (!store) {
            throw new NotFoundError("StoreNotFound");
        }

        if (data.userType === 'OWNER' && store.ownerId !== data.userId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return store;
    }
}

export { GetStoreByIdService };