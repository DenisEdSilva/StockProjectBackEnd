import prismaClient from "../../prisma";

interface ListStoreRequest {
    ownerId: number;
}

class ListStoreService {
    async execute({ ownerId }: ListStoreRequest) {
        try {
            if (!ownerId || isNaN(ownerId)) {
                throw new Error("Invalid owner ID");
            }

            const ownerExists = await prismaClient.user.findUnique({
                where: {
                    id: ownerId,
                },
            });

            if (!ownerExists) {
                throw new Error("Owner not found");
            }

            const stores = await prismaClient.store.findMany({
                where: {
                    ownerId: ownerId,
                },
                select: {
                    id: true,
                    name: true,
                    adress: true,
                    ownerId: true,
                },
            });

            return stores;
        } catch (error) {
            console.error("Error listing stores:", error);
            throw new Error(`Failed to list stores. Error: ${error.message}`);
        }
    }
}

export { ListStoreService };