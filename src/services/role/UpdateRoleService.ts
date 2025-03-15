import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface UpdateRoleRequest {
    roleId: number;
    name: string;
    permissionIds: number[];
}

class UpdateRoleService {
    async execute({ roleId, name, permissionIds }: UpdateRoleRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!roleId || isNaN(roleId)) throw new ValidationError("ID do perfil inválido");
            if (!name?.trim()) throw new ValidationError("Nome inválido");
            if (!permissionIds?.length) throw new ValidationError("Deve conter pelo menos uma permissão");

            const role = await tx.role.findUnique({ 
                where: { id: roleId },
                include: { rolePermissions: true }
            });
            if (!role) throw new NotFoundError("Perfil não encontrado");

            const validPermissions = await tx.permission.count({ 
                where: { id: { in: permissionIds } } 
            });
            if (validPermissions !== permissionIds.length) {
                throw new ValidationError("Contém permissões inválidas");
            }

            await tx.role.update({ where: { id: roleId }, data: { name } });

            const currentIds = role.rolePermissions.map(rp => rp.permissionId);
            const toAdd = permissionIds.filter(id => !currentIds.includes(id));
            const toRemove = currentIds.filter(id => !permissionIds.includes(id));

            if (toRemove.length > 0) {
                await tx.rolePermissionAssociation.deleteMany({
                    where: { roleId, permissionId: { in: toRemove } }
                });
            }

            if (toAdd.length > 0) {
                await tx.rolePermissionAssociation.createMany({
                    data: toAdd.map(permissionId => ({ roleId, permissionId }))
                });
            }

            return await tx.role.findUnique({
                where: { id: roleId },
                include: { rolePermissions: { include: { permission: true } } }
            });
        });
    }
}

export { UpdateRoleService };