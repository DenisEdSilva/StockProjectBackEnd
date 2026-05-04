import { Prisma } from "@prisma/client";
import { ProductDTO } from "@/types/product/ListProduct.types";

interface MapParams {
    id: number;
    price: Prisma.Decimal;
    stock: number;
    createdAt: Date;
    product: {
        id: number;
        sku: string;
        name: string;
        description: string | null;
        banner: string | null;
        category: {
            id: number;
            name: string;
        };
    };
}

export function mapToProductDTO(item: MapParams): ProductDTO {
    return {
        id: item.product.id,
        storeInventoryId: item.id,
        name: item.product.name,
        price: Number(item.price),
        stock: item.stock,
        banner: item.product.banner,
        sku: item.product.sku,
        description: item.product.description,
        category: item.product.category,
        createdAt: item.createdAt
    };
}