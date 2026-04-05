import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class CreateStoreService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        if (data.userType !== 'OWNER') {
            throw new ForbiddenError("OnlyOwnersCanCreateStores");
        }

        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const ownerExists = await tx.user.findUnique({
                where: { 
                    id: data.performedByUserId, 
                    isDeleted: false 
                },
                select: { id: true }
            });

            if (!ownerExists) {
                throw new NotFoundError("OwnerNotFound");
            }

            const storeExists = await tx.store.findFirst({
                where: { 
                    name: data.name, 
                    ownerId: data.performedByUserId, 
                    isDeleted: false 
                }
            });

            if (storeExists) {
                throw new ConflictError("StoreNameAlreadyExists");
            }

            const newStore = await tx.store.create({
                data: {
                    name: data.name,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode.replace(/\D/g, ''),
                    ownerId: data.performedByUserId
                }
            });

            await this.activityTracker.track({
                tx,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "STORE_CREATE",
                userId: data.performedByUserId,
                storeId: newStore.id,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: true,
                details: {
                    name: data.name,
                    city: data.city
                }
            }, tx);

            return newStore;
        });
    }

    private validateInput(data: any) {
        if (!data.name?.trim()) {
            throw new ValidationError("InvalidStoreName");
        }
        if (!data.city?.trim()) {
            throw new ValidationError("InvalidCity");
        }
        if (data.state?.length !== 2) {
            throw new ValidationError("InvalidStateCode");
        }
        if (!/^\d{5}-?\d{3}$/.test(data.zipCode)) {
            throw new ValidationError("InvalidZipCode");
        }
    }
}

export { CreateStoreService };