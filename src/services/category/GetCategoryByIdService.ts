import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface CategoryByIdRequest {
    storeId: number;
    id: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
}

class GetCategoryByIdService {
    async execute(data: CategoryByIdRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
        if (!Number.isInteger(data.id)) {
            throw new ValidationError("InvalidCategoryId");
        }

        const category = await prismaClient.category.findUnique({ 
            where: { 
                id: data.id,
                storeId: data.storeId,
                isDeleted: false
            },
            include: {
                store: { select: { ownerId: true } }
            }
        });

        if (!category) throw new NotFoundError("CategoryNotFound");

        if (data.userType === 'OWNER' && category.store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return {
            id: category.id,
            name: category.name,
            storeId: category.storeId,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        };
    }
}

export { GetCategoryByIdService };