import prismaClient from "../../prisma";
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { CreateCategoryRequest, CreateCategoryResponse } from "@/types/category/CreateCategory.types";

class CreateCategoryService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: CreateCategoryRequest): Promise<CreateCategoryResponse> {
        this.validateInput(data);

        return prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { 
                    id: data.storeId, 
                    isDeleted: false 
                },
                select: { 
                    ownerId: true 
                }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            this.validateAuthorization(data, store.ownerId);

            const existingCategory = await tx.category.findFirst({
                where: {
                    name: data.name,
                    storeId: data.storeId,
                    isDeleted: false
                }
            });

            if (existingCategory) {
                throw new ConflictError("CategoryAlreadyExistsInThisStore");
            }

            const category = await tx.category.create({
                data: {
                    name: data.name,
                    storeId: data.storeId
                },
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    createdAt: true
                }
            });

            await tx.store.update({
                where: { 
                    id: data.storeId 
                },
                data: { 
                    lastActivityAt: new Date() 
                }
            });

            if (data.userType === 'OWNER') {
                await tx.user.update({
                    where: { id: data.performedByUserId },
                    data: { lastActivityAt: new Date() }
                });
            }

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                ownerId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined
            });

            await this.auditLogService.create({
                action: "CATEGORY_CREATE",
                details: {
                    id: category.id,
                    name: category.name
                },
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return category;
        });
    }

    private validateInput(data: CreateCategoryRequest) {
        if (!data.name?.trim()) {
            throw new ValidationError("InvalidCategoryName");
        }

        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }

        if (!data.performedByUserId) {
            throw new ValidationError("InvalidUser");
        }

        if (!['OWNER', 'STORE_USER'].includes(data.userType)) {
            throw new ValidationError("InvalidUserType");
        }
    }

    private validateAuthorization(data: CreateCategoryRequest, ownerId: number) {
        if (data.userType === 'OWNER' && ownerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedStoreAccess");
        }

        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedStoreAccess");
        }
    }
}

export { CreateCategoryService };