import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ListStoreUserRequest {
    storeId: number;
    search?: string;
    page?: number;
    pageSize?: number;
}

class ListStoreUserService {
    async execute({ storeId, search, page = 1, pageSize = 10 }: ListStoreUserRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!storeId || isNaN(storeId)) {
                throw new ValidationError("ID da loja inválido");
            }

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

            const [storeUsers, total] = await Promise.all([
                tx.storeUser.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        storeId: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: { name: "asc" },
                    skip: (page - 1) * pageSize,
                    take: pageSize
                }),
                tx.storeUser.count({ where: whereClause })
            ]);

            return {
                data: storeUsers.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role.name,
                    storeId: user.storeId
                })),
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

export { ListStoreUserService };