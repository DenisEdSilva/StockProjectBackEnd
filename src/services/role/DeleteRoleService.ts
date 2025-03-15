import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface DeleteRoleRequest {
    roleId: number;
    userId: number;
}

class DeleteRoleService {
    async execute({ roleId, userId }: DeleteRoleRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!roleId || isNaN(roleId)) throw new ValidationError("ID do perfil inválido");

            const role = await tx.role.findUnique({
                where: { id: roleId },
                include: { store: true }
            });
            if (!role) throw new NotFoundError("Perfil não encontrado");

            if (role.store.ownerId !== userId) throw new ConflictError("Acesso não autorizado");

            const usersCount = await tx.storeUser.count({ where: { roleId } });
            if (usersCount > 0) throw new ConflictError("Perfil está em uso");

            await tx.role.update({
                where: { id: roleId },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            return { message: "Perfil marcado para exclusão" };
        });
    }
}

export { DeleteRoleService };