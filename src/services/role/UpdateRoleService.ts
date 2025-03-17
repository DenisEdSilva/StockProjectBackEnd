import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface UpdateRoleRequest {
    performedByUserId: number;
    roleId: number;
    name: string;
    permissionIds: number[];
    ipAddress: string;
    userAgent: string;
}

class UpdateRoleService {
    async execute({ performedByUserId, roleId, name, permissionIds, ipAddress, userAgent }: UpdateRoleRequest) {
        const auditLogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {
            if (!roleId || isNaN(roleId)) throw new ValidationError("ID do perfil inválido");
            if (!name?.trim()) throw new ValidationError("Nome inválido");
            if (!permissionIds?.length) throw new ValidationError("Deve conter pelo menos uma permissão");

            const role = await tx.role.findUnique({ 
                where: { id: roleId },
                include: { rolePermissions: true }
            });

            console.log(role)
            if (!role) throw new NotFoundError("Perfil não encontrado");

            const validPermissions = await tx.permission.findMany({ 
                where: { id: { in: permissionIds } },
                select: { id: true } 
            });

            if (validPermissions.length !== permissionIds.length) {
                throw new ValidationError("Contém permissões inválidas");
            }

            console.log(validPermissions)

            await tx.role.update({ 
                where: { 
                    id: roleId 
                }, 
                data: { 
                    name 
                } 
            });

            const currentPermissionIds = role.rolePermissions.map(rp => rp.permissionId);
            const numericPermissionIds = permissionIds.map(Number);

            const toAdd = numericPermissionIds.filter(id => !currentPermissionIds.includes(id));
            console.log("toAdd: ", toAdd);
            
            const toRemove = currentPermissionIds.filter(id => !numericPermissionIds.includes(id));
            console.log("toRemove: ", toRemove);

            if (toRemove.length > 0) {
                await tx.rolePermissionAssociation.deleteMany({
                    where: { 
                        roleId, 
                        permissionId: { 
                            in: toRemove 
                        } 
                    }
                });
            }

            if (toAdd.length > 0) {
                await tx.rolePermissionAssociation.createMany({
                    data: toAdd.map(permissionId => ({ 
                        roleId, 
                        permissionId 
                    })),
                    skipDuplicates: true
                });
            }

            await auditLogService.create({
                action: "ROLE_UPDATE",
                details: {
                    roleId,
                    name,
                    permissionIds
                },
                userId: performedByUserId,
                storeId: role.storeId,
                ipAddress: ipAddress,
                userAgent: userAgent
            })

            return await tx.role.findUnique({
                where: { 
                    id: roleId 
                },
                include: { 
                    rolePermissions: { 
                        include: { 
                            permission: true 
                        } 
                    } 
                }
            });

        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }
}

export { UpdateRoleService };