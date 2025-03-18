import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface ProductRequest {
    banner: string;
    name: string;
    stock: number;
    price: string;
    description: string;
    categoryId: number;
    storeId: number;
    performedByUserId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateProductService {
    async execute(data: ProductRequest) {
        const auditLogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const [category, store] = await Promise.all([
                tx.category.findUnique({ where: { id: data.categoryId } }),
                tx.store.findUnique({ where: { id: data.storeId } })
            ]);

            console.log(category, store);

            const isOwner = await tx.store.findUnique({
                where: { 
                    id: data.storeId 
                },
                select: {
                    ownerId: true
                }
            });

            if (!category) throw new NotFoundError("Categoria não encontrada");
            if (!store) throw new NotFoundError("Loja não encontrada");

            const product = await tx.product.create({
                data: {
                    banner: data.banner,
                    name: data.name,
                    stock: data.stock,
                    price: data.price,
                    description: data.description,
                    categoryId: data.categoryId,
                    storeId: data.storeId
                },
                select: { id: true, name: true, price: true, stock: true }
            });

            await auditLogService.create({
                    action: "PRODUCT_CREATE",
                    details: {
                        banner: data.banner,
                        name: data.name,
                        stock: data.stock,
                        price: data.price,
                        description: data.description,
                        categoryId: data.categoryId
                    },
                    ...(isOwner ? {
                        userId: data.performedByUserId
                    }: {
                        storeUserId: data.performedByUserId
                    }),
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
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