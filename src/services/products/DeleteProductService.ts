import prismaClient from "../../prisma";
import { NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class DeleteProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        return await prismaClient.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId, storeId: data.storeId, isDeleted: false },
                include: { store: { select: { ownerId: true } } }
            });

            if (!product) throw new NotFoundError("ProductNotFound");

            if (data.userType === 'OWNER' && product.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }
            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            await tx.stockMoviment.updateMany({
                where: { productId: data.productId, isDeleted: false },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            const deletedProduct = await tx.product.update({
                where: { id: data.productId },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "PRODUCT_DELETE",
                details: { id: data.productId, name: product.name, sku: product.sku },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return { message: "ProductDeletedSuccessfully", deletedAt: deletedProduct.deletedAt };
        });
    }
}

export { DeleteProductService };