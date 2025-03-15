import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface ProductRequest {
    banner: string;
    name: string;
    stock: number;
    price: string;
    description: string;
    categoryId: number;
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateProductService {
    async execute(data: ProductRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const [category, store] = await Promise.all([
                tx.category.findUnique({ where: { id: data.categoryId } }),
                tx.store.findUnique({ where: { id: data.storeId } })
            ]);

            if (!category) throw new NotFoundError("Categoria não encontrada");
            if (!store) throw new NotFoundError("Loja não encontrada");

            const product = await tx.product.create({
                data: { ...data },
                select: { id: true, name: true, price: true, stock: true }
            });

            await tx.auditLog.create({
                data: {
                    action: "PRODUCT_CREATED",
                    details: JSON.stringify(product),
                    userId: data.userId,
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return product;
        });
    }

    private validateInput(data: ProductRequest) {
        if (!data.banner?.trim()) throw new ValidationError("Banner obrigatório");
        if (!data.name?.trim()) throw new ValidationError("Nome obrigatório");
        if (data.stock < 0) throw new ValidationError("Estoque inválido");
        if (isNaN(parseFloat(data.price))) throw new ValidationError("Preço inválido");
    }
}

export { CreateProductService };