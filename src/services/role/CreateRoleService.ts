import prismaClient from "../../prisma";
import { ValidationError, ConflictError, NotFoundError } from "../../errors";

interface CreateRoleRequest {
    name: string;
    storeId: number;
    permissionIds: number[];
}

class CreateRoleService {
    async execute({ name, storeId, permissionIds }: CreateRoleRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!name?.trim()) throw new ValidationError("Nome do perfil inválido");
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");
            if (!permissionIds?.length) throw new ValidationError("Deve conter pelo menos uma permissão");

            const storeExists = await tx.store.findUnique({ where: { id: storeId } });
            if (!storeExists) throw new NotFoundError("Loja não encontrada");

            const roleExists = await tx.role.findFirst({ 
                where: { name, storeId, isDeleted: false } 
            });
            if (roleExists) throw new ConflictError("Perfil já existe nesta loja");

            const validPermissions = await tx.permission.count({ 
                where: { id: { in: permissionIds } } 
            });
            if (validPermissions !== permissionIds.length) {
                throw new ValidationError("Contém permissões inválidas");
            }

            const newRole = await tx.role.create({ data: { name, storeId } });

            await tx.rolePermissionAssociation.createMany({
                data: permissionIds.map(permissionId => ({
                    roleId: newRole.id,
                    permissionId
                }))
            });

            return await tx.role.findUnique({
                where: { id: newRole.id },
                include: { rolePermissions: { include: { permission: true } } }
            });
        });
    }
}

export { CreateRoleService };