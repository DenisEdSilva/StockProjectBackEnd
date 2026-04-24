import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface ListStoreUserRequest {
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    search?: string;
    page: number;
    pageSize: number;
}

class ListStoreUserService {
    async execute(data: ListStoreUserRequest) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        const store = await prismaClient.store.findUnique({
            where: { id: data.storeId, isDeleted: false },
            select: { ownerId: true }
        });

        if (!store) {
            throw new NotFoundError("StoreNotFound");
        }

        if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        const whereClause = {
            storeId: data.storeId,
            isDeleted: false,
            ...(data.search && {
                name: {
                    contains: data.search,
                    mode: "insensitive" as const
                }
            })
        };

        const [storeUsers, total] = await Promise.all([
            prismaClient.storeUser.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    storeId: true,
                    roleId: true,
                    role: {
                        select: { 
                            id: true,
                            name: true 
                        }
                    },
                    createdAt: true
                },
                orderBy: { name: "asc" },
                skip: (data.page - 1) * data.pageSize,
                take: data.pageSize
            }),
            prismaClient.storeUser.count({ where: whereClause })
        ]);

        return {
            data: storeUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                roleId: user.roleId,
                role: {
                    id: user.role.id,
                    name: user.role.name
                },
                storeId: user.storeId,
                createdAt: user.createdAt
            })),
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total,
                totalPages: Math.ceil(total / data.pageSize)
            }
        };
    }
}

export { ListStoreUserService };