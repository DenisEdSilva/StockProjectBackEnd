import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface DeleteProductRequest {
    id: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteProductService {
    async execute({ id, userId, ipAddress, userAgent }: DeleteProductRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (!id || isNaN(id)) throw new ValidationError("ID do produto inválido");

            const product = await tx.product.findUnique({
                where: { id },
                include: { stockMoviment: true }
            });

            if (!product) throw new NotFoundError("Produto não encontrado");
            if (product.isDeleted) throw new ConflictError("Produto já excluído");

            await tx.stockMoviment.updateMany({
                where: { id: { in: product.stockMoviment.map(m => m.id) } },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            const deletedProduct = await tx.product.update({
                where: { id },
                data: { isDeleted: true, deletedAt: new Date() }
            });

            await tx.auditLog.create({
                data: {
                    action: "PRODUCT_DELETED",
                    details: JSON.stringify({ productId: id }),
                    userId,
                    storeId: product.storeId,
                    ipAddress,
                    userAgent
                }
            });

            return { 
                message: "Produto excluído",
                deletedAt: deletedProduct.deletedAt
            };
        });
    }
}

export { DeleteProductService };