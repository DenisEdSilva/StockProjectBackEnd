import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

class ListPermissionService {
    async execute() {
        return await prismaClient.$transaction(async (tx) => {
            return await tx.permission.findMany({
                orderBy: { id: 'asc' }
            });
        })
    }
}

export { ListPermissionService };