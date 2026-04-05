import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface GetProductRequest {
    storeId: number;
    id: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
}

class GetProductByIdService {
    async execute(data: GetProductRequest) {
        if (!Number.isInteger(data.id) || !Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidIdsProvided");
        }

        const product = await prismaClient.product.findUnique({ 
            where: {
                id: data.id,
                storeId: data.storeId,
                isDeleted: false
            },
            include: {
                category: { select: { name: true } },
                store: { select: { ownerId: true } }
            }
        });

        if (!product) throw new NotFoundError("ProductNotFound");

        if (data.userType === 'OWNER' && product.store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        const { store, ...productData } = product;
        return productData;
    }
}

export { GetProductByIdService };