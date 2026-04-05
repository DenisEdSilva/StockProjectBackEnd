import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface GetRoleRequest {
    id: number;
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
}

class GetRoleByIdService {
    async execute(data: GetRoleRequest) {
        this.validateInput(data);

        const role = await prismaClient.role.findUnique({
            where: {
                id: data.id,
                storeId: data.storeId,
                isDeleted: false
            },
            include: {
                store: {
                    select: {
                        ownerId: true,
                        isDeleted: true
                    }
                },
                permissions: {
                    include: {
                        permission: {
                            select: {
                                id: true,
                                name: true,
                                action: true,
                                resource: true
                            }
                        }
                    }
                }
            }
        });

        if (!role || role.store.isDeleted) {
            throw new NotFoundError("RoleNotFound");
        }

        if (data.userType === 'OWNER' && role.store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return role;
    }

    private validateInput(data: GetRoleRequest) {
        if (!Number.isInteger(data.id)) {
            throw new ValidationError("InvalidRoleId");
        }

        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
    }
}

export { GetRoleByIdService };