import prismaClient from "../../prisma";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { DeleteCategoryRequest, DeleteCategoryResponse } from "@/types/category/DeleteCategory.types";

class DeleteCategoryService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: DeleteCategoryRequest): Promise<DeleteCategoryResponse> {
        if (!Number.isInteger(data.categoryId)) {
            throw new ValidationError("InvalidCategoryId");
        }

        return await prismaClient.$transaction(async (tx) => {
            const category = await tx.category.findFirst({
                where: { 
                    id: data.categoryId, 
                    storeId: data.storeId, 
                    isDeleted: false 
                },
                include: { 
                    store: { select: { ownerId: true } },
                    _count: { 
                        select: { 
                            products: { where: { isDeleted: false } } 
                        } 
                    }
                }
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

            if (category._count.products > 0) {
                throw new ConflictError("CannotDeleteCategoryWithActiveProducts");
            }

            const deletedCategory = await tx.category.update({
                where: { id: data.categoryId },
                data: { 
                    isDeleted: true, 
                    deletedAt: new Date() 
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                ownerId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined
            });

            await this.auditLogService.create({
                action: "CATEGORY_DELETE",
                details: { 
                    categoryId: data.categoryId, 
                    name: category.name 
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return { 
                message: "CategoryDeletedSuccessfully",
                deletedAt: deletedCategory.deletedAt,
                success: true
            };
        });
    }
}

export { DeleteCategoryService };