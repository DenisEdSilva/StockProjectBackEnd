import prismaClient from "../../prisma";

interface DeleteStoreUserRequest {
    id: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteStoreUserService {
    async execute({ id, userId, ipAddress, userAgent }: DeleteStoreUserRequest) {
        try {
            if (!id) {
                throw new Error("StoreUser ID is required");
            }

            const storeUserExists = await prismaClient.storeUser.findUnique({
                where: {
                    id: id,
                },
            });

            if (!storeUserExists) {
                throw new Error("StoreUser not found");
            }

            const deletedStoreUser = await prismaClient.storeUser.update({
                where: {
                    id: id,
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "DELETE_STORE_USER",
                    details: JSON.stringify({
                        storeUserId: id,
                        deletedAt: new Date(),
                    }),
                    userId: userId,
                    storeId: storeUserExists.storeId,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            });

            return { message: "StoreUser marked as deleted successfully" };
        } catch (error) {
            console.error("Error on soft delete StoreUser: ", error);
            throw new Error(`Failed to soft delete StoreUser. Error: ${error.message}`);
        }
    }
}

export { DeleteStoreUserService };