import prismaClient from "../../prisma";

interface RoleRequest {
    name: string;
    storeId: number;
    permissionIds: number[];
}

class CreateRoleService {
    async execute({ name, storeId, permissionIds }: RoleRequest) {

        const roleExists = await prismaClient.role.findFirst({
            where: {
                name: name,
                storeId: storeId
            }
        })

        if (roleExists) {
            throw new Error("Role already exists");
        }

        const role = await prismaClient.role.create({
            data: {
                name: name,
                storeId: storeId,
                },
            select: {
                id: true,
                name: true,
                storeId: true
            }
        })
        await prismaClient.rolePermissionAssociation.createMany({
            data: permissionIds.map(permissionId => ({
            roleId: role.id,
            permissionId,
            })),
        });    

        return role
    }
}

export { CreateRoleService };