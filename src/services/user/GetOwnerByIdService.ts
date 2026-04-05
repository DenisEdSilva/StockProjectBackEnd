import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface GetOwnerByIdRequest {
    ownerId: number;
    performedByUserId: number;
    userType: string;
}

class GetOwnerByIdService {
    async execute(data: GetOwnerByIdRequest) {
        if (!Number.isInteger(data.ownerId)) {
            throw new ValidationError("InvalidId");
        }
        
        if (data.userType !== 'OWNER' || data.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        const owner = await prismaClient.user.findUnique({ 
            where: { id: data.ownerId, isDeleted: false },
            select: {
                id: true, 
                name: true,
                ownedStores: {
                    where: { isDeleted: false },
                    select: { id: true, name: true }
                }
            }
        });

        if (!owner) {
            throw new NotFoundError("UserNotFound");
        }

        return owner;
    }
}

export { GetOwnerByIdService };