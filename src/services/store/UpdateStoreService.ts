import prismaClient from "../../prisma";

interface UpdateStoreRequest {
    id: number;
    name?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateStoreService {
    async execute({ id, name, city, state, zipCode, userId, ipAddress, userAgent }: UpdateStoreRequest) {
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
                    city: city || storeExists.city,
                    state: state || storeExists.state,
                    zipCode: zipCode || storeExists.zipCode,
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "UPDATE_STORE",
                    details: JSON.stringify({
                        storeId: id,
                        updatedFields: {
                            name: name || "No changes",
                            city: city || "No changes",
                            state: state || "No changes",
                            zipCode: zipCode || "No changes",
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