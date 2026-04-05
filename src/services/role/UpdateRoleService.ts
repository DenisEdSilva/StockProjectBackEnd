import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface UpdateRoleRequest {
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    storeId: number;
    roleId: number;
    name: string;
    permissionIds: number[];
    ipAddress: string;
    userAgent: string;
}

class UpdateRoleService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: UpdateRoleRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const role = await tx.role.findUnique({
                where: { 
                    id: data.roleId,
                    storeId: data.storeId,
                    isDeleted: false 
                },
                include: { 
                    store: { select: { ownerId: true } },
                    permissions: { select: { permissionId: true } }
                }
            });

            if (!role) {
                throw new NotFoundError("RoleNotFound");
            }

            if (data.userType === 'OWNER' && role.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const validPermissions = await tx.permission.findMany({
                where: { id: { in: data.permissionIds } },
                select: { id: true }
            });

            if (validPermissions.length !== data.permissionIds.length) {
                throw new ValidationError("InvalidPermissionsDetected");
            }

            const currentIds = role.permissions.map(p => p.permissionId);
            const toAdd = data.permissionIds.filter(id => !currentIds.includes(id));
            const toRemove = currentIds.filter(id => !data.permissionIds.includes(id));

            await tx.role.update({
                where: { id: data.roleId },
                data: { name: data.name }
            });

            if (toRemove.length > 0) {
                await tx.rolePermissionAssociation.deleteMany({
                    where: {
                        roleId: data.roleId,
                        permissionId: { in: toRemove }
                    }
                });
            }

            if (toAdd.length > 0) {
                await tx.rolePermissionAssociation.createMany({
                    data: toAdd.map(id => ({
                        roleId: data.roleId,
                        permissionId: id
                    }))
                });
            }

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "ROLE_UPDATE",
                details: {
                    roleId: data.roleId,
                    name: data.name,
                    added: toAdd,
                    removed: toRemove
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return await tx.role.findUnique({
                where: { id: data.roleId },
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            });
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }

    private validateInput(data: UpdateRoleRequest) {
        if (!Number.isInteger(data.roleId)) {
            throw new ValidationError("InvalidRoleId");
        }
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
        if (!data.name?.trim()) {
            throw new ValidationError("InvalidRoleName");
        }
        if (!Array.isArray(data.permissionIds) || data.permissionIds.length === 0) {
            throw new ValidationError("AtLeastOnePermissionIsRequired");
        }
    }
}

export { UpdateRoleService };