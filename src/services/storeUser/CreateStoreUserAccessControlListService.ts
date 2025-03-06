import prismaClient from "../../prisma";

interface UserACLRequest {
    storeUserId: number;
}

class CreateStoreUserAccessControlListService {
    async execute({ storeUserId }: UserACLRequest) {
        try {
            if (!storeUserId || isNaN(storeUserId)) {
                throw new Error("Invalid store user ID");
            }

            const user = await prismaClient.storeUser.findUnique({
                where: {
                    id: storeUserId,
                },
            });

            if (!user) {
                throw new Error("User not found");
            }

            const rolePermissions = await prismaClient.rolePermissionAssociation.findMany({
                where: {
                    roleId: user.roleId,
                },
                include: {
                    permission: true,
                },
            });

            const userPermissions = rolePermissions.map((permission) => ({
                action: permission.permission.action,
                resource: permission.permission.resource,
            }));

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roleId,
                permissions: userPermissions,
            };
        } catch (error) {
            console.error("Error creating store user ACL:", error);
            throw new Error(`Failed to create store user ACL. Error: ${error.message}`);
        }
    }
}

export { CreateStoreUserAccessControlListService };