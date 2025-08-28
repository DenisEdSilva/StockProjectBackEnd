import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListRoleRequest {
    storeId: number;
    search?: string;
    page?: number;
    pageSize?: number;
}

class ListRoleService {
    async execute({ storeId, search, page = 1, pageSize = 10 }: ListRoleRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");

            const store = await tx.store.findUnique({ where: { id: storeId } });
            if (!store) throw new NotFoundError("Loja não encontrada");

            const whereClause = {
                storeId,
                isDeleted: false,
                ...(search && {
                    name: {
                        contains: search,
                        mode: "insensitive" as const
                    }
                })
            };

            const [roles, total] = await Promise.all([
                tx.role.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        _count: { select: { StoreUser: true, permissions: true } }
                    },
                    orderBy: { name: "asc" },
                    skip: (page - 1) * pageSize,
                    take: pageSize
                }),
                tx.role.count({ where: whereClause })
            ]);

            return {
                data: roles,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        });
    }
}

export { ListRoleService };