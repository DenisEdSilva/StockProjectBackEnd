import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface UpdateRoleRequest {
    roleId: number;
    name: string;
    permissionIds: number[];
}

class UpdateRoleService {
    async execute({ roleId, name, permissionIds }: UpdateRoleRequest) {

        console.log( roleId, name, permissionIds );
        return await prismaClient.$transaction(async (tx) => {
            if (!roleId || isNaN(roleId)) throw new ValidationError("ID do perfil inválido");
            if (!name?.trim()) throw new ValidationError("Nome inválido");
            if (!permissionIds?.length) throw new ValidationError("Deve conter pelo menos uma permissão");

            const role = await tx.role.findUnique({ 
                where: { id: roleId },
                include: { rolePermissions: true }
            });

            console.log(role)
            if (!role) throw new NotFoundError("Perfil não encontrado");

            const validPermissions = await tx.permission.findMany({ 
                where: { id: { in: permissionIds } },
                select: { id: true } 
            });

            if (validPermissions.length !== permissionIds.length) {
                throw new ValidationError("Contém permissões inválidas");
            }

            console.log(validPermissions)

            await tx.role.update({ 
                where: { 
                    id: roleId 
                }, 
                data: { 
                    name 
                } 
            });

            const currentPermissionIds = role.rolePermissions.map(rp => rp.permissionId);
            const numericPermissionIds = permissionIds.map(Number);

            const toAdd = numericPermissionIds.filter(id => !currentPermissionIds.includes(id));
            console.log("toAdd: ", toAdd);
            
            const toRemove = currentPermissionIds.filter(id => !numericPermissionIds.includes(id));
            console.log("toRemove: ", toRemove);

            if (toRemove.length > 0) {
                await tx.rolePermissionAssociation.deleteMany({
                    where: { 
                        roleId, 
                        permissionId: { 
                            in: toRemove 
                        } 
                    }
                });
            }

            if (toAdd.length > 0) {
                await tx.rolePermissionAssociation.createMany({
                    data: toAdd.map(permissionId => ({ 
                        roleId, 
                        permissionId 
                    })),
                    skipDuplicates: true
                });
            }

            return await tx.role.findUnique({
                where: { 
                    id: roleId 
                },
                include: { 
                    rolePermissions: { 
                        include: { 
                            permission: true 
                        } 
                    } 
                }
            });
        });
    }
}

export { UpdateRoleService };