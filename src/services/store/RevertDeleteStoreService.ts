import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class RevertDeleteStoreService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { 
                    ownerId: true, 
                    isDeleted: true 
                }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            if (!store.isDeleted) {
                throw new ConflictError("StoreNotDeleted");
            }

            if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const restoredStore = await tx.store.update({
                where: { id: data.storeId },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                    lastActivityAt: new Date()
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "STORE_RESTORE",
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER',
                details: {
                    storeId: data.storeId
                }
            }, tx);

            return restoredStore;
        });
    }
}

export { RevertDeleteStoreService };