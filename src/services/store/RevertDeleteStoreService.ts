import prismaClient from "../../prisma";

interface RevertDeleteStoreRequest {
    storeId: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class RevertDeleteStoreService {
    async execute({ storeId, userId, ipAddress, userAgent }: RevertDeleteStoreRequest) {
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

            const revertedStore = await prismaClient.$transaction(async (prisma) => {

                const revertedStore = await prisma.store.update({
                    where: {
                        id: storeId,
                    },
                    data: {
                        isDeleted: false,
                        deletedAt: null,
                    },
                });

                await prisma.stockMovimentStore.updateMany({
                    where: { storeId: storeId },
                    data: { isDeleted: false, deletedAt: null },
                });

                await prisma.stockMoviment.updateMany({
                    where: { storeId: storeId },
                    data: { isDeleted: false, deletedAt: null },
                });

                await prisma.product.updateMany({
                    where: { storeId: storeId },
                    data: { isDeleted: false, deletedAt: null },
                });

                await prisma.category.updateMany({
                    where: { storeId: storeId },
                    data: { isDeleted: false, deletedAt: null },
                });

                await prisma.storeUser.updateMany({
                    where: { storeId: storeId },
                    data: { isDeleted: false, deletedAt: null },
                });

                await prisma.role.updateMany({
                    where: { storeId: storeId },
                    data: { isDeleted: false, deletedAt: null },
                });

                await prisma.auditLog.create({
                    data: {
                        action: "REVERT_DELETE_STORE",
                        details: JSON.stringify({
                            storeId: storeId,
                            revertedAt: new Date(),
                        }),
                        userId: userId,
                        storeId: storeId,
                        ipAddress: ipAddress,
                        userAgent: userAgent,
                    },
                });

                return revertedStore;
            });

            return {
                message: "Store and related data reverted successfully",
                store: revertedStore,
            };
        } catch (error) {
            console.error("Error reverting delete store: ", error);
            throw new Error(`Failed to revert delete store. Error: ${error.message}`);
        }
    }
}

export { RevertDeleteStoreService };