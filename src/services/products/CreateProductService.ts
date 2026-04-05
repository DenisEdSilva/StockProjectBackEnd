import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { Prisma } from "@prisma/client";

interface ProductRequest {
    banner: string;
    name: string;
    price: Prisma.Decimal;
    description: string;
    categoryId: number;
    storeId: number;
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    ipAddress: string;
    userAgent: string;
}

class CreateProductService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: ProductRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: data.storeId, isDeleted: false },
                select: { id: true, name: true, ownerId: true }
            });

            if (!store) throw new NotFoundError("StoreNotFound");

            if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            const category = await tx.category.findFirst({
                where: { id: data.categoryId, storeId: data.storeId, isDeleted: false },
                select: { id: true, name: true }
            });

            if (!category) throw new NotFoundError("CategoryNotFoundInThisStore");

            const categoryAbbr = this.generateAbbr(category.name, 4);
            const storeAbbr = this.generateAbbr(store.name, 4);
            const productCode = await this.getUniqueProductCode(tx, data.name, data.categoryId);
            
            const sku = `${categoryAbbr}-${productCode}-${storeAbbr}`;

            const skuExists = await tx.product.findFirst({ where: { sku, storeId: data.storeId } });
            if (skuExists) throw new ConflictError("ProductWithThisSKUAlreadyExists");

            const product = await tx.product.create({
                data: {
                    banner: data.banner,
                    name: data.name,
                    price: data.price,
                    description: data.description,
                    sku: sku,
                    categoryId: data.categoryId,
                    storeId: data.storeId
                },
                select: { id: true, name: true, price: true, stock: true, sku: true }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "PRODUCT_CREATE",
                details: { productId: product.id, sku: product.sku, name: product.name },
                storeId: data.storeId,
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            return product;
        });
    }

    private generateAbbr(text: string, len: number): string {
        return text.replace(/[^a-zA-Z]/g, '').substring(0, len).toUpperCase().padEnd(len, 'X');
    }

    private async getUniqueProductCode(tx: any, name: string, categoryId: number): Promise<string> {
        const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const baseCode = cleaned.substring(0, 5);

        const existing = await tx.product.findFirst({
            where: { name: name.trim(), categoryId: categoryId },
            select: { sku: true }
        });

        if (existing) {
            return existing.sku.split('-')[1];
        }

        const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
        return `${baseCode}${randomSuffix}`;
    }

    private validateInput(data: ProductRequest) {
        if (!data.name?.trim()) {
            throw new ValidationError("InvalidProductName");
        }
        if (!data.price || data.price.isNaN() || data.price.lessThanOrEqualTo(0)) {
            throw new ValidationError("InvalidPrice");
        }
    }
}

export { CreateProductService };