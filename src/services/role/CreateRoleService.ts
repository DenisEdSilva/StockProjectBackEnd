import prismaClient from "../../prisma";

interface RoleRequest {
    name: string;
    storeId: number;
    permissionIds: number[];
}

class CreateRoleService {
    async execute({ name, storeId, permissionIds }: RoleRequest) {
        try {
            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid role name");
            }

            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
                throw new Error("Permission IDs must be a non-empty array");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            const validPermissions = await prismaClient.permission.findMany({
                where: {
                    id: {
                        in: permissionIds,
                    },
                },
                select: {
                    id: true,
                },
            });

            const validPermissionIds = validPermissions.map((p) => p.id);
            const invalidPermissionIds = permissionIds.filter(
                (permissionId) => !validPermissionIds.includes(permissionId)
            );

            if (invalidPermissionIds.length > 0) {
                throw new Error(`Invalid permission IDs: ${invalidPermissionIds.join(", ")}`);
            }

            const roleExists = await prismaClient.role.findFirst({
                where: {
                    name: name,
                    storeId: storeId,
                },
            });

            if (roleExists) {
                throw new Error("Role already exists");
            }

            const result = await prismaClient.$transaction(async (prisma) => {
                const role = await prisma.role.create({
                    data: {
                        name: name,
                        storeId: storeId,
                    },
                    select: {
                        id: true,
                        name: true,
                        storeId: true,
                    },
                });

                await prisma.rolePermissionAssociation.createMany({
                    data: permissionIds.map((permissionId) => ({
                        roleId: role.id,
                        permissionId: permissionId,
                    })),
                });

                return role;
            });

            return result;
        } catch (error) {
            console.error("Error creating role:", error);
            throw new Error(`Failed to create role. Error: ${error.message}`);
        }
    }
}

export { CreateRoleService };