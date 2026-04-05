import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

class UpdateProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: any) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId, storeId: data.storeId, isDeleted: false },
                include: { store: { select: { ownerId: true } } }
            });

            if (!product) {
                throw new NotFoundError("ProductNotFound");
            }

            if (data.userType === 'OWNER' && product.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }
            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.categoryId) {
                const category = await tx.category.findFirst({
                    where: { id: data.categoryId, storeId: data.storeId, isDeleted: false }
                });
                if (!category) throw new NotFoundError("CategoryNotFoundInThisStore");
            }

            const updatedProduct = await tx.product.update({
                where: { id: data.productId },
                data: {
                    name: data.name || undefined,
                    price: data.price || undefined,
                    description: data.description || undefined,
                    categoryId: data.categoryId || undefined,
                    sku: data.sku || undefined
                },
                select: { id: true, name: true, price: true, stock: true, sku: true, updatedAt: true }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "PRODUCT_UPDATE",
                details: { 
                    old: { name: product.name, price: product.price }, 
                    new: { name: updatedProduct.name, price: updatedProduct.price } 
                },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return updatedProduct;
        });
    }

    private validateInput(data: any) {
        if (data.price && isNaN(parseFloat(data.price))) {
             throw new ValidationError("InvalidPriceFormat");
        }
    }
}

export { UpdateProductService };