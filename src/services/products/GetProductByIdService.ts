import prismaClient from "../../prisma";
import {
    ValidationError,
    NotFoundError,
    ForbiddenError
} from "../../errors";

import {
    GetProductByIdRequest,
    GetProductByIdResponse
} from "@/types/product/GetProductById.types";

import { mapGetProductById } from "@/mappers/product/getProductById.mapper";

class GetProductByIdService {
    async execute(
        data: GetProductByIdRequest
    ): Promise<GetProductByIdResponse> {

        this.validateInput(data);

        const inventoryItem = await this.getProductOrFail(data);

        this.validateAuthorization(data, inventoryItem.store.ownerId);

        return mapGetProductById(inventoryItem);
    }

    private validateInput(data: GetProductByIdRequest) {
        if (!Number.isInteger(data.id)) {
            throw new ValidationError("InvalidProductId");
        }

        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
    }

    private async getProductOrFail(data: GetProductByIdRequest) {
        const inventoryItem = await prismaClient.storeInventory.findFirst({
            where: {
                productId: data.id,
                storeId: data.storeId,
                isDeleted: false,
                product: {
                    isDeleted: false
                }
            },
            include: {
                product: {
                    select: {
                        id: true,
                        sku: true,
                        name: true,
                        description: true,
                        banner: true,
                        categoryId: true,
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                store: {
                    select: {
                        ownerId: true
                    }
                }
            }
        });

        if (!inventoryItem) {
            throw new NotFoundError("ProductNotFoundInStore");
        }

        return inventoryItem;
    }

    private validateAuthorization(
        data: GetProductByIdRequest,
        ownerId: number
    ) {
        if (
            data.userType === "OWNER" &&
            ownerId !== data.performedByUserId
        ) {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        if (
            data.userType === "STORE_USER" &&
            data.tokenStoreId !== data.storeId
        ) {
            throw new ForbiddenError("UnauthorizedAccess");
        }
    }
}

export { GetProductByIdService };