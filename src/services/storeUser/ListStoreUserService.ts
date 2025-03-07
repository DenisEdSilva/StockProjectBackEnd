import prismaClient from "../../prisma";

interface UserRequest {
    storeId: number
}

class ListStoreUserService {
    async execute({ storeId }: UserRequest) {
        try {
            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            const storeUserList = await prismaClient.storeUser.findMany({
                where: {
                    storeId: storeId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    storeId: true,
                    createdAt: true
                },
                orderBy: {
                    name: "asc"
                }
            })
    
            return {
                count: storeUserList.length,
                users: storeUserList
            }

        } catch (error) {
            console.error("Error on listing store users:", error);
            throw new Error(`Failed on listing store users. Error: ${error.message}`);
        }
    }
}

export { ListStoreUserService }