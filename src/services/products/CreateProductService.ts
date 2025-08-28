import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

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
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const [category, store] = await Promise.all([
                tx.category.findUnique({ where: { id: data.categoryId, isDeleted: false } }),
                tx.store.findUnique({ where: { id: data.storeId, isDeleted: false } })
            ]);

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

            const generateAbbreviation = (name: string, length: number) => {
                const letters = name.replace(/\s/g, '').substring(0, length).toUpperCase();

                return letters.padEnd(length, 'X'.substring(0, length));
            }

            const generateUniqueCode = (productName: string, length = 7) => {
                const cleanedName = productName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                const initials = cleanedName.split(' ').map(word => word.charAt(0)).join('');

                const code = (initials + cleanedName).substring(0, length);

                return code;
            }

            async function getOrCreateUniqueCode(productName: string, categoryid: number, ) {
                const cleanedName = data.name.trim();

                const existingProduct = await tx.product.findFirst({
                    where: {
                        name: cleanedName,
                        categoryId: data.categoryId,
                    },
                    select: {
                        sku: true,
                    },
                });

                if (existingProduct) {
                    const [_, uniqueCode] = existingProduct.sku.split('-');
                    return uniqueCode;
                }

                return generateUniqueCode(productName)
            }


            const categoryAbbreviation = generateAbbreviation(category.name, 4);
            const storePreffix = generateAbbreviation(store.name, 4);
            const uniqueCode = await getOrCreateUniqueCode(data.name, data.categoryId);
            const skuFormated = `${categoryAbbreviation}-${uniqueCode}-${storePreffix}`;

            const product = await tx.product.create({
                data: {
                    banner: data.banner,
                    name: data.name,
                    stock: data.stock,
                    price: data.price,
                    description: data.description,
                    sku: skuFormated,
                    categoryId: data.categoryId,
                    storeId: data.storeId
                },
                select: { id: true, name: true, price: true, stock: true, sku: true }
            });

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.performedByUserId
            })

            await auditLogService.create({
                    action: "PRODUCT_CREATE",
                    details: {
                        banner: data.banner,
                        name: data.name,
                        stock: data.stock,
                        price: data.price,
                        sku: skuFormated,
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