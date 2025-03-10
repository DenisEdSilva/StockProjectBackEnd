import prismaClient from "../../prisma";

interface RevertDeleteStoreRequest {
    storeId: number;
}

class RevertDeleteStoreService {
    async execute({ storeId }: RevertDeleteStoreRequest) {
        try {
            if (!storeId) {
                throw new Error("Store ID is required");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            if (!storeExists.isDeleted) {
                throw new Error("Store is not marked as deleted");
            }

            // Reverte a deleção da store
            const revertedStore = await prismaClient.store.update({
                where: {
                    id: storeId,
                },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                },
            });

            // Reverte a deleção dos dados relacionados
            await prismaClient.stockMovimentStore.updateMany({
                where: { storeId: storeId },
                data: { isDeleted: false, deletedAt: null },
            });

            await prismaClient.stockMoviment.updateMany({
                where: { storeId: storeId },
                data: { isDeleted: false, deletedAt: null },
            });

            await prismaClient.product.updateMany({
                where: { storeId: storeId },
                data: { isDeleted: false, deletedAt: null },
            });

            await prismaClient.category.updateMany({
                where: { storeId: storeId },
                data: { isDeleted: false, deletedAt: null },
            });

            await prismaClient.storeUser.updateMany({
                where: { storeId: storeId },
                data: { isDeleted: false, deletedAt: null },
            });

            await prismaClient.role.updateMany({
                where: { storeId: storeId },
                data: { isDeleted: false, deletedAt: null },
            });

            return { message: "Store and related data reverted successfully", store: revertedStore };
        } catch (error) {
            console.error("Error reverting delete store: ", error);
            throw new Error(`Failed to revert delete store. Error: ${error.message}`);
        }
    }
}

export { RevertDeleteStoreService };