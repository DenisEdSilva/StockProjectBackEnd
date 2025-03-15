import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ConflictError } from "../../errors";

interface UpdateProductRequest {
    id: number;
    name?: string;
    price?: string;
    description?: string;
    categoryId?: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateProductService {
    private validateInput(data: UpdateProductRequest) {
        if (data.price && isNaN(parseFloat(data.price))) throw new ValidationError("Preço inválido");
        if (data.name?.length > 100) throw new ValidationError("Nome muito longo (máx. 100 caracteres)");
    }

    async execute(data: UpdateProductRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);
            if (!data.id || isNaN(data.id)) throw new ValidationError("ID do produto inválido");

            const product = await tx.product.findUnique({ where: { id: data.id } });
            if (!product) throw new NotFoundError("Produto não encontrado");
            if (product.isDeleted) throw new ConflictError("Produto excluído");

            if (data.categoryId) {
                const category = await tx.category.findUnique({ where: { id: data.categoryId } });
                if (!category) throw new NotFoundError("Categoria não existe");
            }

            const updatedProduct = await tx.product.update({
                where: { id: data.id },
                data: { ...data },
                select: { id: true, name: true, price: true, stock: true }
            });

            await tx.auditLog.create({
                data: {
                    action: "PRODUCT_UPDATED",
                    details: JSON.stringify(updatedProduct),
                    userId: data.userId,
                    storeId: product.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return updatedProduct;
        });
    }
}

export { UpdateProductService };