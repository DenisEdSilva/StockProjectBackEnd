import prismaClient from "../../prisma";
import { ValidationError, ForbiddenError, NotFoundError } from "../../errors";

class ListRoleService {
    async execute(data: any) {
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

        if (data.userType === 'OWNER' && store.ownerId !== data.userId) {
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

        const [roles, total] = await Promise.all([
            prismaClient.role.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    permissions: {
                        include: {
                            permission: {
                                select: {
                                    id: true,
                                    action: true,
                                    resource: true
                                }
                            }
                        }
                    },
                    createdAt: true,
                    _count: { 
                        select: { 
                            StoreUser: { where: { isDeleted: false } }, 
                            permissions: true 
                        } 
                    }
                },
                orderBy: { name: "asc" },
                skip: (data.page - 1) * data.pageSize,
                take: data.pageSize
            }),
            prismaClient.role.count({ where: whereClause })
        ]);

        const formattedRoles = roles.map(role => ({
            ...role,
            permissions: role.permissions.map(rp => rp.permission) 
        }));

        return {
            data: formattedRoles,
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total,
                totalPages: Math.ceil(total / data.pageSize)
            }
        };
    }
}

export { ListRoleService };