import prismaClient from "../../prisma";

interface DeleteStoreUserRequest {
    id: number;
}

class DeleteStoreUserService {
    async execute({ id }: DeleteStoreUserRequest) {
        try {
            if (!id) {
                throw new Error("StoreUser ID is required");
            }

            const storeUserExists = await prismaClient.storeUser.findUnique({
                where: {
                    id: id
                }
            });

            if (!storeUserExists) {
                throw new Error("StoreUser not found");
            }

            await prismaClient.storeUser.update({
                where: {
                    id: id
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            });

            return { message: "StoreUser marked as deleted successfully" };
        } catch (error) {
            console.error("Error on soft delete StoreUser: ", error);
            throw new Error(`Failed to soft delete StoreUser. Error: ${error.message}`);
        }
    }
}

export { DeleteStoreUserService };