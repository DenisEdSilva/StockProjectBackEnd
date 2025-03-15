import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface DeleteCategoryRequest {
    id: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteCategoryService {
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

    async execute({ id, userId, ipAddress, userAgent }: DeleteCategoryRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!id || isNaN(id)) throw new ValidationError("ID da categoria inválido");

            const category = await tx.category.findUnique({
                where: { id },
                include: { products: { include: { stockMoviment: true } } }
            });

            if (!category) throw new NotFoundError("Categoria não encontrada");
            if (category.isDeleted) throw new ConflictError("Categoria já excluída");

            if (category.products.length > 0) {
                await this.softDeleteProducts(category.products, tx);
            }

            const deletedCategory = await tx.category.update({
                where: { id },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            await tx.auditLog.create({
                data: {
                    action: "CATEGORY_DELETED",
                    details: JSON.stringify({
                        categoryId: id,
                        deletedProducts: category.products.length
                    }),
                    userId,
                    storeId: category.storeId,
                    ipAddress,
                    userAgent
                }
            });

            return { 
                message: "Categoria e produtos marcados para exclusão",
                deletedAt: deletedCategory.deletedAt
            };
        });
    }
}

export { DeleteCategoryService };