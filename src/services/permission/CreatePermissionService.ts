import prismaClient from "../../prisma";

interface PermissionRequest {
    name: string;
    action: string;
    resource: string;
}

class CreatePermissionService {
    async execute({ name, action, resource }: PermissionRequest) {
        const permission = await prismaClient.permission.create({
            data: {
                name: name,
                action: action.toUpperCase(),
                resource: resource.toUpperCase()
            },
            select: {
                id: true,
                name: true,
                action: true,
                resource: true
            }
        })

        return permission
    }
}

export { CreatePermissionService };