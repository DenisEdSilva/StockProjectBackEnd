import prismaClient from "../../prisma";
import { ValidationError, ConflictError } from "../../errors";
import { PermissionAction } from "@prisma/client";

interface PermissionRequest {
    name: string;
    action: string;
    resource: string;
}

class CreatePermissionService {
    async execute(data: PermissionRequest) {
        this.validateInput(data);

        const actionEnum = data.action.toUpperCase() as PermissionAction;
        const resourceUpper = data.resource.toUpperCase();

        const permissionExists = await prismaClient.permission.findFirst({
            where: {
                OR: [
                    { name: data.name },
                    { action: actionEnum, resource: resourceUpper }
                ]
            }
        });

        if (permissionExists) {
            throw new ConflictError("PermissionAlreadyExists");
        }

        const permission = await prismaClient.permission.create({
            data: {
                name: data.name,
                action: actionEnum,
                resource: resourceUpper,
            },
            select: {
                id: true,
                name: true,
                action: true,
                resource: true,
            }
        });

        return permission;
    }

    private validateInput(data: PermissionRequest) {
        if (!data.name?.trim()) {
            throw new ValidationError("InvalidPermissionName");
        }
        if (!data.action?.trim()) {
            throw new ValidationError("InvalidAction");
        }
        if (!data.resource?.trim()) {
            throw new ValidationError("InvalidResource");
        }
        if (!Object.values(PermissionAction).includes(data.action.toUpperCase() as PermissionAction)) {
            throw new ValidationError("InvalidActionType");
        }
    }
}

export { CreatePermissionService };