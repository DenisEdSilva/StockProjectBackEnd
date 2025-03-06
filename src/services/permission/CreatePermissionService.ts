import prismaClient from "../../prisma";

interface PermissionRequest {
    name: string;
    action: string;
    resource: string;
}

class CreatePermissionService {
    async execute({ name, action, resource }: PermissionRequest) {
        try {
            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid permission name");
            }

            if (!action || typeof action !== "string" || action.trim() === "") {
                throw new Error("Invalid action");
            }

            if (!resource || typeof resource !== "string" || resource.trim() === "") {
                throw new Error("Invalid resource");
            }

            const permissionExists = await prismaClient.permission.findFirst({
                where: {
                    name: name,
                },
            });

            if (permissionExists) {
                throw new Error("Permission already exists");
            }

            const permission = await prismaClient.permission.create({
                data: {
                    name: name,
                    action: action.toUpperCase(),
                    resource: resource.toUpperCase(),
                },
                select: {
                    id: true,
                    name: true,
                    action: true,
                    resource: true,
                },
            });

            return permission;
        } catch (error) {
            console.error("Error creating permission:", error);
            throw new Error(`Failed to create permission. Error: ${error.message}`);
        }
    }
}

export { CreatePermissionService };