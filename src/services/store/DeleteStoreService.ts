import prismaClient from "../../prisma";

interface DeleteStoreRequest {
    storeId: number;
    ownerId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteStoreService {
    async execute({ storeId, ownerId, ipAddress, userAgent }: DeleteStoreRequest) {
        try {
            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            if (!ownerId || isNaN(ownerId)) {
                throw new Error("Invalid owner ID");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                    ownerId: ownerId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found or you do not have permission to delete it");
            }

            const relatedRecords = await this.getRelatedRecords(storeId);

            await this.deleteRelatedRecords(storeId);

            const deletedStore = await prismaClient.store.update({
                where: {
                    id: storeId,
                },
                data: {
                    deletedAt: new Date(),
                    isDeleted: true,
                },
                select: {
                    id: true,
                    name: true,
                    adress: true,
                    ownerId: true,
                    deletedAt: true,
                    isDeleted: true,
                },
            });

            await this.logDeleteAction({
                storeId,
                ownerId,
                ipAddress,
                userAgent,
                relatedRecords,
            });

            return deletedStore;
        } catch (error) {
            console.error("Error deleting store:", error);
            throw new Error(`Failed to delete store. Error: ${error.message}`);
        }
    }

    private async getRelatedRecords(storeId: number) {
        const [
            roles,
            storeUsers,
            categories,
            products,
            stockMoviments,
            stockMovimentStores,
        ] = await Promise.all([
            prismaClient.role.findMany({ where: { storeId } }),
            prismaClient.storeUser.findMany({ where: { storeId } }),
            prismaClient.category.findMany({ where: { storeId } }),
            prismaClient.product.findMany({ where: { storeId } }),
            prismaClient.stockMoviment.findMany({ where: { storeId } }),
            prismaClient.stockMovimentStore.findMany({ where: { storeId } }),
        ]);

        return {
            roles,
            storeUsers,
            categories,
            products,
            stockMoviments,
            stockMovimentStores,
        };
    }

    private async deleteRelatedRecords(storeId: number) {
        await Promise.all([
            prismaClient.role.updateMany({
                where: { storeId },
                data: { deletedAt: new Date(), isDeleted: true },
            }),
            prismaClient.storeUser.updateMany({
                where: { storeId },
                data: { deletedAt: new Date(), isDeleted: true },
            }),
            prismaClient.category.updateMany({
                where: { storeId },
                data: { deletedAt: new Date(), isDeleted: true },
            }),
            prismaClient.product.updateMany({
                where: { storeId },
                data: { deletedAt: new Date(), isDeleted: true },
            }),
            prismaClient.stockMoviment.updateMany({
                where: { storeId },
                data: { deletedAt: new Date(), isDeleted: true },
            }),
            prismaClient.stockMovimentStore.updateMany({
                where: { storeId },
                data: { deletedAt: new Date(), isDeleted: true },
            }),
        ]);
    }

    private async logDeleteAction({
        storeId,
        ownerId,
        ipAddress,
        userAgent,
        relatedRecords,
    }: {
        storeId: number;
        ownerId: number;
        ipAddress: string;
        userAgent: string;
        relatedRecords: any;
    }) {
        try {
            await prismaClient.auditLog.create({
                data: {
                    action: "DELETE_STORE",
                    details: JSON.stringify({
                        storeId,
                        relatedRecords,
                    }),
                    userId: ownerId,
                    storeId: storeId,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    isOwner: true,
                },
            });
        } catch (error) {
            console.error("Error logging delete action:", error);
            throw new Error("Failed to log delete action");
        }
    }
}

export { DeleteStoreService };