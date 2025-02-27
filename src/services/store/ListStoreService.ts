import prismaClient from "../../prisma";

interface ListStoreRequest {
    ownerId: number
}

class ListStoreService {
    async execute({ ownerId }: ListStoreRequest) {
        const store = await prismaClient.store.findMany({
            where: {
                ownerId: ownerId
            },
            select: {
                id: true,
                name: true,
                adress: true,
                ownerId: true
            }
        });

        return store;
    }
}

export { ListStoreService };