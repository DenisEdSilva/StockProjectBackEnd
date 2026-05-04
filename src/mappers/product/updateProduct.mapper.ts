import { Prisma } from "@prisma/client";
import { UpdateProductResponse } from "@/types/product/UpdateProduct.types";

interface MapParams {
    product: {
        id: number;
        name: string;
        description: string | null;
        banner: string | null;
        sku: string;
        categoryId: number;
        updatedAt: Date;
    };
    price: Prisma.Decimal;
    stock: number;
    storeInventoryId: number;
}

export function mapToUpdateProductResponse({
    product,
    price,
    stock,
    storeInventoryId
}: MapParams): UpdateProductResponse {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        banner: product.banner,
        sku: product.sku,
        categoryId: product.categoryId,
        updatedAt: product.updatedAt,
        price: Number(price),
        stock,
        storeInventoryId
    };
}