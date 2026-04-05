import prismaClient from "../../prisma";
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface CreateRoleRequest {
    performedByUserId: number;
    userType: string;
    name: string;
    storeId: number;
    permissionIds: number[];
    ipAddress: string;
    userAgent: string;
}

class CreateRoleService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: CreateRoleRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: data.storeId, isDeleted: false },
                select: { ownerId: true }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedStoreAccess");
            }

            const roleExists = await tx.role.findFirst({
                where: { 
                    name: data.name, 
                    storeId: data.storeId, 
                    isDeleted: false 
                }
            });

            if (roleExists) {
                throw new ConflictError("RoleNameAlreadyExistsInThisStore");
            }

            const validPermissionsCount = await tx.permission.count({
                where: { id: { in: data.permissionIds } }
            });

            if (validPermissionsCount !== data.permissionIds.length) {
                throw new ValidationError("InvalidPermissionsDetected");
            }

            const role = await tx.role.create({
                data: {
                    name: data.name,
                    storeId: data.storeId,
                    permissions: {
                        create: data.permissionIds.map(id => ({
                            permissionId: id
                        }))
                    }
                },
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "ROLE_CREATE",
                details: {
                    roleId: role.id,
                    name: data.name,
                    permissionIds: data.permissionIds
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return role;
        });
    }

    private validateInput(data: CreateRoleRequest) {
        if (!data.name?.trim()) {
            throw new ValidationError("InvalidRoleName");
        }
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
        if (!Array.isArray(data.permissionIds) || data.permissionIds.length === 0) {
            throw new ValidationError("AtLeastOnePermissionIsRequired");
        }
    }
}

export { CreateRoleService };