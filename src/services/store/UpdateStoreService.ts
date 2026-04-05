import { Prisma } from "@prisma/client";
import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class UpdateStoreService {
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
                where: { 
                    id: data.storeId, 
                    isDeleted: false 
                }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const updateData: Prisma.StoreUpdateInput = {
                lastActivityAt: new Date()
            };

            if (data.name && data.name !== store.name) {
                const nameExists = await tx.store.findFirst({
                    where: {
                        name: data.name,
                        ownerId: store.ownerId,
                        NOT: { id: data.storeId },
                        isDeleted: false
                    }
                });

                if (nameExists) {
                    throw new ConflictError("StoreNameAlreadyExists");
                }
                updateData.name = data.name;
            }

            if (data.city) updateData.city = data.city;
            if (data.state) {
                if (data.state.length !== 2) {
                    throw new ValidationError("InvalidStateCode");
                }
                updateData.state = data.state;
            }
            if (data.zipCode) {
                updateData.zipCode = data.zipCode.replace(/\D/g, '');
            }

            const updatedStore = await tx.store.update({
                where: { id: data.storeId },
                data: updateData
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "STORE_UPDATE",
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER',
                details: {
                    updatedFields: Object.keys(updateData)
                }
            }, tx);

            return updatedStore;
        });
    }
}

export { UpdateStoreService };