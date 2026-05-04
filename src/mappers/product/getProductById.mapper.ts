import { StoreInventory, ProductCatalog, Prisma } from "@prisma/client";
import { GetProductByIdResponse } from "@/types/product/GetProductById.types";

type InventoryWithProduct = {
    id: number;
    price: Prisma.Decimal;
    stock: number;

    product: {
        id: number;
        sku: string;
        name: string;
        description: string | null;
        banner: string | null;
        categoryId: number;
        category: {
            id: number;
            name: string;
        };
    };
};

export function mapGetProductById(
    item: InventoryWithProduct
): GetProductByIdResponse {
    return {
        id: item.product.id,
        storeInventoryId: item.id,
        name: item.product.name,
        price: item.price.toString(),
        stock: item.stock,
        banner: item.product.banner,
        sku: item.product.sku,
        description: item.product.description,
        categoryId: item.product.categoryId,
        category: item.product.category
    };
}