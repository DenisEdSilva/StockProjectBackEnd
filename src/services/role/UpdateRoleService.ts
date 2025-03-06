import prismaClient from "../../prisma";

interface RoleRequest {
    roleId: number;
    name?: string;
    storeId?: number;
    permissionIds: number[]
}

class UpdateRoleService {
    async execute({ roleId, name, storeId, permissionIds }: RoleRequest) {

        try{
            if (!roleId || isNaN(roleId)) {
                throw new Error("Invalid role ID");
            }

            if (storeId && isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            if (!Array.isArray(permissionIds)) {
                throw new Error("Permission IDs must be an array");
            }

            const roleExists = await prismaClient.role.findFirst({
                where: {
                    id: roleId
                }
            })
    
            if (!roleExists) {
                throw new Error("Role not found");
            }
            
            const storeExists = await prismaClient.store.findFirst({
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
    
            const uniquePermissionIds = [...new Set(permissionIds)];
            if (uniquePermissionIds.length !== permissionIds.length) {
                throw new Error("Duplicate permission IDs are not allowed.");
            }  
    
            const result = await prismaClient.$transaction(async (prisma) => {
                const role = await prisma.role.update({
                    where: {
                        id: roleId
                    },
                    data: {
                        ...(name && { name: name }),
                        ...(storeId && { storeId: storeId })
                    },
                })
    
                
                const currentRolePermissions = await prisma.rolePermissionAssociation.findMany({
                    where: {
                        roleId: roleId
                    },
                    select:{
                        permissionId: true
                    }
                })
        
                const currentPermissionIds = currentRolePermissions.map((rp) => rp.permissionId)
        
                const permissionsToAdd = permissionIds.filter(
                    (permissionId) => !currentPermissionIds.includes(permissionId)
                )
                if (permissionsToAdd.length > 0) {
                    await prisma.rolePermissionAssociation.createMany({
                        data: permissionsToAdd.map((permissionId) => ({
                            roleId: role.id,
                            permissionId: permissionId
                        }))
                    })
                }        
                
                const permissionsToRemove = currentPermissionIds.filter(
                    (permissionId) => !permissionIds.includes(permissionId)
                )
                if (permissionsToRemove.length > 0) {
                    await prisma.rolePermissionAssociation.deleteMany({
                        where: {
                            roleId: role.id,
                            permissionId: {
                                in: permissionsToRemove
                            }
                        }
                    })

                }

                const updatedRolePermissions = await prisma.rolePermissionAssociation.findMany({
                    where: {
                        roleId: roleId
                    },
                    select: {
                        permissionId: true
                    }
                })

                return {
                    role,
                    addedPermissions: permissionsToAdd,
                    removedPermissions: permissionsToRemove,
                    currentPermissions: updatedRolePermissions.map((rp) => rp.permissionId)
                }
            })

            return result
        }catch(err){
            throw new Error(`Failed to update role with ID ${roleId}. Error: ${err.message}`);
        }
    }
}

export { UpdateRoleService };