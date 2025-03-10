import prismaClient from "../../prisma";

interface UpdateStoreRequest {
    storeId: number;
    name?: string;
    adress?: string;
    ownerId: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateStoreService {
    async execute({ storeId, name, adress, ownerId, ipAddress, userAgent }: UpdateStoreRequest) {
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
                throw new Error("Store not found or you do not have permission to update it");
            }

            const updatedStore = await prismaClient.store.update({
                where: {
                    id: storeId,
                },
                data: {
                    ...(name && { name: name }),
                    ...(adress && { adress: adress }),
                },
                select: {
                    id: true,
                    name: true,
                    adress: true,
                    ownerId: true,
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "UPDATE_STORE",
                    details: JSON.stringify({
                        storeId: updatedStore.id,
                        name: updatedStore.name,
                        adress: updatedStore.adress,
                    }),
                    userId: ownerId,
                    storeId: storeId,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    isOwner: true,
                },
            });

            return updatedStore;
        } catch (error) {
            console.error("Error updating store:", error);
            throw new Error(`Failed to update store. Error: ${error.message}`);
        }
    }
}

export { UpdateStoreService };