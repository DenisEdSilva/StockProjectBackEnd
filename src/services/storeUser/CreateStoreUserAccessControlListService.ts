import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface UserACLRequest {
    storeUserId: number;
}

interface ACLResponse {
    id: number;
    name: string;
    email: string;
    role: number;
    permissions: Array<{ action: string; resource: string }>;
}

class CreateStoreUserAccessControlListService {
    async execute({ storeUserId }: UserACLRequest): Promise<ACLResponse> {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(storeUserId);

            const user = await tx.storeUser.findUnique({
                where: { id: storeUserId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    isDeleted: true
                }
            });

            if (!user) throw new NotFoundError("Usuário não encontrado");
            if (user.isDeleted) throw new NotFoundError("Usuário desativado");

            const rolePermissions = await tx.rolePermissionAssociation.findMany({
                where: { roleId: user.roleId },
                include: { permission: true }
            });

            const permissions = rolePermissions.map((rp) => ({
                action: rp.permission.action,
                resource: rp.permission.resource
            }));

            await tx.auditLog.create({
                data: {
                    action: "ACL_CREATED",
                    details: `ACL gerado para usuário ${user.id}`,
                    userId: storeUserId
                }
            });

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roleId,
                permissions
            };
        });
    }
    
    private validateInput(storeUserId: number) {
        if (!storeUserId || isNaN(storeUserId)) {
            throw new ValidationError("ID de usuário inválido");
        }
    }
}

export { CreateStoreUserAccessControlListService };