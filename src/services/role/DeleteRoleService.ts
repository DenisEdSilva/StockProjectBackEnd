import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class DeleteRoleService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        if (!Number.isInteger(data.roleId)) {
            throw new ValidationError("InvalidRoleId");
        }

        return await prismaClient.$transaction(async (tx) => {
            const role = await tx.role.findUnique({
                where: { 
                    id: data.roleId,
                    storeId: data.storeId,
                    isDeleted: false 
                },
                include: { store: { select: { ownerId: true } } }
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

            const usersCount = await tx.storeUser.count({ 
                where: { 
                    roleId: data.roleId,
                    isDeleted: false 
                } 
            });

            if (usersCount > 0) {
                throw new ConflictError("RoleIsInUseByActiveUsers");
            }

            const deletedRole = await tx.role.update({
                where: { id: data.roleId },
                data: { 
                    isDeleted: true, 
                    deletedAt: new Date() 
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "ROLE_DELETE",
                details: { roleId: data.roleId, name: role.name },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return { 
                message: "RoleDeletedSuccessfully",
                deletedAt: deletedRole.deletedAt
            };
        });
    }
}

export { DeleteRoleService };