import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface DeleteProductRequest {
    performedByUserId: number;
    storeId: number;
    categoryId: number;
    productId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteProductService {
    async execute({ performedByUserId, storeId, categoryId, productId, ipAddress, userAgent }: DeleteProductRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker
        return await prismaClient.$transaction(async (tx) => {

            const isOwner = await tx.store.findUnique({ 
                where: { 
                    id: storeId 
                }, 
                select: { 
                    ownerId: true 
                } 
            });

            if (!productId || isNaN(productId)) throw new ValidationError("ID do produto inválido");

            const product = await tx.product.findUnique({
                where: { id: productId },
                include: { stockMoviment: true }
            });

            if (!product) throw new NotFoundError("Produto não encontrado");
            if (product.isDeleted) throw new ConflictError("Produto já excluído");

            await tx.stockMoviment.updateMany({
                where: { id: { in: product.stockMoviment.map(m => m.id) } },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            const deletedProduct = await tx.product.update({
                where: { id: productId },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            await activityTracker.track({
                tx,
                storeId: storeId,
                performedByUserId: performedByUserId
            })

            const deletedData = await tx.product.findUnique({ 
                where: { 
                    id: productId 
                } 
            });

            await auditLogService.create({
                action: "PRODUCT_DELETE",
                details: {
                    deletedData
                },
                ...(isOwner ? {
                    userId: performedByUserId,
                } : {
                    storeUserId: performedByUserId
                }),
                storeId: product.storeId,
                ipAddress,
                userAgent
            });

            return { 
                message: "Produto excluído",
                deletedAt: deletedProduct.deletedAt
            };
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }
}

export { DeleteProductService };