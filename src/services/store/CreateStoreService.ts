import prismaClient from "../../prisma";

interface StoreRequest {
    name: string;
    adress:string;
    ownerId: string;
}

class CreateStoreService {
    async execute({name, adress, ownerId}: StoreRequest) {
        const store = await prismaClient.store.create({
            data: {
                name: name,
                adress: adress,
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

export { CreateStoreService };