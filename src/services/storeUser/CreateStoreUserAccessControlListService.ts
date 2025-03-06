import prismaClient from "../../prisma";

interface UserACLRequest {
    storeUserId: number;
}

class CreateStoreUserAccessControlListService {
    async execute({ storeUserId }: UserACLRequest) {

        const user = await prismaClient.storeUser.findFirst({
            where: {
                id: storeUserId
            }
        })

        if (!user) {
            throw new Error("User not found");
        }

        const rolePermissions = await prismaClient.rolePermissionAssociation.findMany({
            where: {
                roleId: user.roleId
            },
            include: {
                permission: true
            }
        })

        const userPermissions = rolePermissions.map( permission => ({
            action: permission.permission.action,
            resource: permission.permission.resource
        }))

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.roleId,
            permissions: userPermissions
        }

        return userData
    }
}

export { CreateStoreUserAccessControlListService }