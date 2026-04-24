import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface GetStoreUserRequest {
    storeId: number;
    storeUserId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
}

class GetStoreUserByIdService {
    async execute(data: GetStoreUserRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        if (!Number.isInteger(data.storeUserId)) {
            throw new ValidationError("InvalidStoreUserId");
        }

        const storeUser = await prismaClient.storeUser.findUnique({
            where: {
                id: data.storeUserId,
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
                role: {
                    select: {
                        name: true
                    }
                },
                userPermissions: {
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

        if (!storeUser || storeUser.store.isDeleted) {
            throw new NotFoundError("StoreUserNotFound");
        }

        if (data.userType === 'OWNER' && storeUser.store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        console.log(storeUser.userPermissions)

        return {
            id: storeUser.id,
            name: storeUser.name,
            email: storeUser.email,
            roleId: storeUser.roleId,
            roleName: storeUser.role.name,
            storeId: storeUser.storeId,
            createdAt: storeUser.createdAt,
            updatedAt: storeUser.updatedAt,
            userPermissions: storeUser.userPermissions.map(up => up.permission)
        };
    }
}

export { GetStoreUserByIdService };