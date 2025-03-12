import prismaClient from "../../prisma";

interface UpdateStoreRequest {
    id: number;
    name?: string;
    address?: string;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateStoreService {
    async execute({ id, name, address, userId, ipAddress, userAgent }: UpdateStoreRequest) {
        try {
            if (!id) {
                throw new Error("Store ID is required");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: id,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            const updatedStore = await prismaClient.store.update({
                where: {
                    id: id,
                },
                data: {
                    name: name || storeExists.name,
                    address: address || storeExists.address,
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "UPDATE_STORE",
                    details: JSON.stringify({
                        storeId: id,
                        updatedFields: {
                            name: name || "No changes",
                            address: address || "No changes",
                        },
                    }),
                    userId: userId,
                    storeId: id,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            });

            return { message: "Store updated successfully", store: updatedStore };
        } catch (error) {
            console.error("Error updating store:", error);
            throw new Error(`Failed to update store. Error: ${error.message}`);
        }
    }
}

export { UpdateStoreService };