import prismaClient from "../../prisma";

class ListPermissionService {
    async execute() {
        const permissions = await prismaClient.permission.findMany({
            select: {
                id: true,
                name: true,
                action: true,
                resource: true
            },
            orderBy: {
                id: 'asc'
            }
        });

        return permissions;
    }
}

export { ListPermissionService };