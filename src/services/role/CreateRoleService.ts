import prismaClient from "../../prisma";
import { ValidationError, ConflictError, NotFoundError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface CreateRoleRequest {
    performedByUserId: number;
    name: string;
    storeId: number;
    permissionIds: number[];
    ipAddress: string;
    userAgent: string;
}

class CreateRoleService {
    async execute({ performedByUserId, name, storeId, permissionIds, ipAddress, userAgent }: CreateRoleRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            if (!name?.trim()) throw new ValidationError("Nome do perfil inválido");
            if (!storeId || isNaN(storeId)) throw new ValidationError("ID da loja inválido");
            if (!permissionIds?.length) throw new ValidationError("Deve conter pelo menos uma permissão");

            const storeExists = await tx.store.findUnique({ where: { id: storeId } });
            if (!storeExists) throw new NotFoundError("Loja não encontrada");

            const roleExists = await tx.role.findFirst({ 
                where: { name, storeId, isDeleted: false } 
            });
            if (roleExists) throw new ConflictError("Perfil já existe nesta loja");

            const validPermissions = await tx.permission.count({ 
                where: { id: { in: permissionIds } } 
            });
            if (validPermissions !== permissionIds.length) {
                throw new ValidationError("Contém permissões inválidas");
            }

            const newRole = await tx.role.create({ data: { name, storeId } });

            await tx.rolePermissionAssociation.createMany({
                data: permissionIds.map(permissionId => ({
                    roleId: newRole.id,
                    permissionId
                }))
            });

            await activityTracker.track({
                tx,
                storeId: storeId,
                performedByUserId: performedByUserId
            })

            await auditLogService.create({
                action: "ROLE_CREATE",
                details: {
                    roleId: newRole.id,
                    roleName: name,
                    storeId: storeId,
                    permissionIds
                },
                storeId: storeId,
                userId: performedByUserId,
                ipAddress:  ipAddress,
                userAgent: userAgent
            })


            return await tx.role.findUnique({
                where: { id: newRole.id },
                include: { rolePermissions: { include: { permission: true } } }
            });
        });
    }
}

export { CreateRoleService };