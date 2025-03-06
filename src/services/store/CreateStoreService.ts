import prismaClient from "../../prisma";

interface StoreRequest {
    name: string;
    adress: string;
    ownerId: number;
}

class CreateStoreService {
    async execute({ name, adress, ownerId }: StoreRequest) {
        try {
            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid store name");
            }

            if (!adress || typeof adress !== "string" || adress.trim() === "") {
                throw new Error("Invalid store address");
            }

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

            const store = await prismaClient.store.create({
                data: {
                    name: name,
                    adress: adress,
                    ownerId: ownerId,
                    userStores: {
                        create: {
                            userId: ownerId,
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    adress: true,
                    ownerId: true,
                },
            });

            return store;
        } catch (error) {
            console.error("Error creating store:", error);
            throw new Error(`Failed to create store. Error: ${error.message}`);
        }
    }
}

export { CreateStoreService };