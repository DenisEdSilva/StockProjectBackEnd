import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface DeleteRoleRequest {
    performedByUserId: number;
    storeId: number;
    roleId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteRoleService {
    async execute({ performedByUserId, storeId, roleId, ipAddress, userAgent }: DeleteRoleRequest) {
        const auditlogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {
            if (!roleId || isNaN(roleId)) throw new ValidationError("ID do perfil inválido");

            const isOwner = tx.store.findUnique({
                where: {
                    id: storeId
                },
                select: {
                    ownerId: true
                }
            })

            const role = await tx.role.findUnique({
                where: { id: roleId },
                include: { store: true }
            });
            if (!role) throw new NotFoundError("Perfil não encontrado");

            if (role.store.ownerId !== performedByUserId) throw new ConflictError("Acesso não autorizado");

            const usersCount = await tx.storeUser.count({ where: { roleId } });
            if (usersCount > 0) throw new ConflictError("Perfil está em uso");

            const deletedRole = await tx.role.update({
                where: { id: roleId },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            const deletedData = await tx.role.findUnique({ where: { id: roleId }})

            await auditlogService.create({
                action: "ROLE_DELETE",
                details: {
                    deletedData
                },
                ...(isOwner ? {
                    userId: performedByUserId
                } : {
                    storeUserId: performedByUserId
                }),
                storeId: storeId,
                ipAddress: ipAddress,
                userAgent: userAgent
            })

            return { 
                message: "cargo excluído",
                deletedAt: deletedRole.deletedAt
            };
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }
}

export { DeleteRoleService };