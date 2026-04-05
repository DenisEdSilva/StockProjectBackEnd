import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class DeleteStoreUserService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const user = await tx.storeUser.findUnique({
                where: { 
                    id: data.storeUserId, 
                    storeId: data.storeId, 
                    isDeleted: false 
                },
                include: { store: { select: { ownerId: true } } }
            });

            if (!user) {
                throw new NotFoundError("StoreUserNotFound");
            }

            if (data.userType === 'OWNER' && user.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const deletedUser = await tx.storeUser.update({
                where: { id: data.storeUserId },
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
                action: "STORE_USER_DELETE",
                details: { 
                    deletedUserId: data.storeUserId, 
                    email: user.email 
                },
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return { 
                message: "UserDeletedSuccessfully",
                deletedAt: deletedUser.deletedAt
            };
        });
    }

    private validateInput(data: any) {
        if (!Number.isInteger(data.storeUserId)) {
            throw new ValidationError("InvalidStoreUserId");
        }
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
    }
}

export { DeleteStoreUserService };