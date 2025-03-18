import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface DeleteCategoryRequest {
    performedByUserId: number;
    storeId: number;
    categoryId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteCategoryService {
    async execute({ performedByUserId, storeId, categoryId, ipAddress, userAgent }: DeleteCategoryRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            const isOwner = await tx.store.findUnique({
                where: {
                    id: storeId
                },
                select: {
                    ownerId: true
                }
            })

            if (!categoryId || isNaN(categoryId)) throw new ValidationError("ID da categoria inválido");

            const category = await tx.category.findUnique({
                where: { 
                    id: categoryId
                },
                select: {
                    id: true,
                    storeId: true,
                    isDeleted: true,
                    products: { 
                        include: { 
                            stockMoviment: {
                                select: {
                                    id: true
                                }
                            },
                        }
                    }
                }
            });

            if (!category) throw new NotFoundError("Categoria não encontrada");
            if (category.isDeleted) throw new ConflictError("Categoria já excluída");

            if (category.products.length > 0) {
                await this.softDeleteProducts(category.products, tx);
            }

            const deletedCategory = await tx.category.update({
                where: { 
                    id: categoryId
                },
                data: { 
                    isDeleted: true, 
                    deletedAt: new Date() 
                }
            });

            await activityTracker.track({
                tx,
                storeId: storeId,
                performedByUserId: performedByUserId
            })

            const deletedData = await tx.category.findUnique({ where: { id: category.id } });

            await auditLogService.create({
                action: "CATEGORY_DELETE",
                details: {
                    deletedData,
                },
                ...(isOwner ? {
                    userId: performedByUserId,
                } : {
                    storeUserId: performedByUserId
                }),
                storeId: category.storeId,
                ipAddress,
                userAgent
            });

            return { 
                message: "Categoria e produtos marcados para exclusão",
                deletedAt: deletedCategory.deletedAt
            };
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }

    private async softDeleteProducts(products: any[], tx: any) {
        const productIds = products.map(p => p.id);
        const movimentIds = products.flatMap(p => p.stockMoviment.map(m => m.id));

        await Promise.all([
            tx.product.updateMany({
                where: { id: { in: productIds } },
                data: { isDeleted: true, deletedAt: new Date() }
            }),
            tx.stockMoviment.updateMany({
                where: { id: { in: movimentIds } },
                data: { isDeleted: true, deletedAt: new Date() }
            })
        ]);
    }
}

export { DeleteCategoryService };