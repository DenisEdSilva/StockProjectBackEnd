import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class UpdateCategoryService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        this.validateInput(data.name);

        return await prismaClient.$transaction(async (tx) => {
            const category = await tx.category.findUnique({
                where: { 
                    id: data.categoryId,
                    storeId: data.storeId,
                    isDeleted: false 
                },
                include: { store: { select: { ownerId: true } } }
            });

            if (!category) {
                throw new NotFoundError("CategoryNotFound");
            }

            if (data.userType === 'OWNER' && category.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.name !== category.name) {
                const nameExists = await tx.category.findFirst({
                    where: { 
                        name: data.name, 
                        storeId: data.storeId, 
                        isDeleted: false,
                        NOT: { id: data.categoryId }
                    }
                });

                if (nameExists) {
                    throw new ConflictError("CategoryNameAlreadyExists");
                }
            }

            const updatedCategory = await tx.category.update({
                where: { id: data.categoryId },
                data: { name: data.name },
                select: { id: true, name: true, updatedAt: true }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "CATEGORY_UPDATE",
                details: { 
                    oldName: category.name, 
                    newName: data.name 
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return updatedCategory;
        });
    }

    private validateInput(name: string) {
        if (!name?.trim() || name.length > 50) {
            throw new ValidationError("InvalidCategoryName");
        }
    }
}

export { UpdateCategoryService };