import prismaClient from "../../prisma";

interface StoreRequest {
    name: string;
    city: string;
    state: string;
    zipCode: string;
    ownerId: number;
}

class CreateStoreService {
    async execute({ name, city, state, zipCode, ownerId }: StoreRequest) {
        try {
            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid store name");
            }

            if (!city || typeof city !== "string" || city.trim() === "") {
                throw new Error("Invalid city");
            }

            if (!zipCode || typeof zipCode !== "string" || zipCode.trim() === "") {
                throw new Error("Invalid zip code");
            }

            if (!state || typeof state !== "string" || state.trim() === "") {
                throw new Error("Invalid state");
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
                    city: city,
                    state: state,
                    zipCode: zipCode,
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
                    city: true,
                    state: true,
                    zipCode: true,
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