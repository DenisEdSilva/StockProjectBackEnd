import prismaClient from "../../prisma";

interface RoleRequest {
    storeId: number;
}

class ListRoleService {
    async execute({ storeId }: RoleRequest) {
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

            const roleList = await prismaClient.role.findMany({
                where: {
                    storeId: storeId,
                },
                select: {
                    id: true,
                    name: true,
                    storeId: true,
                    createdAt: true,
                },
                orderBy: {
                    name: "asc",
                },
            });

            return {
                count: roleList.length,
                roles: roleList,
            };
        } catch (error) {
            console.error("Error on listing roles:", error);
            throw new Error(`Failed on listing roles. Error: ${error.message}`);
        }
    }
}

export { ListRoleService };