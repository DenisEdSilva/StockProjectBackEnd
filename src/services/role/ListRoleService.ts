import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListRoleRequest {
    storeId: number;
}

class ListRoleService {
    async execute({ storeId }: ListRoleRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

            const store = await tx.store.findUnique({ where: { id: storeId } });
            if (!store) throw new NotFoundError("Loja não encontrada");

            return await tx.role.findMany({
                where: { storeId, isDeleted: false },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    _count: { select: { StoreUser: true, rolePermissions: true } }
                },
                orderBy: { name: "asc" }
            });
        });
    }
}

export { ListRoleService };