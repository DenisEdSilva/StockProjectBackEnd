import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface StoreRequest {
    name: string;
    city: string;
    state: string;
    zipCode: string;
    ownerId: number;
}

class CreateStoreService {
    async execute(data: StoreRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const ownerExists = await tx.user.findUnique({
                where: { id: data.ownerId },
                select: { id: true }
            });

            if (!ownerExists) throw new NotFoundError("Proprietário não encontrado");

            const newStore = await tx.store.create({
                data: {
                    name: data.name,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    ownerId: data.ownerId
                },
            });

            await tx.auditLog.create({
                data: {
                    action: "STORE_CREATED",
                    details: JSON.stringify({
                        storeId: newStore.id,
                        ownerId: data.ownerId
                    }),
                    userId: data.ownerId,
                    storeId: newStore.id
                }
            });

            return newStore;
        });
    }

    private validateInput(data: StoreRequest) {
        if (!data.name?.trim()) throw new ValidationError("Nome da loja inválido");
        if (!data.city?.trim()) throw new ValidationError("Cidade inválida");
        if (!data.state?.trim()) throw new ValidationError("Estado inválido");
        if (!data.zipCode?.trim()) throw new ValidationError("CEP inválido");
        if (!data.ownerId || isNaN(data.ownerId)) throw new ValidationError("ID do proprietário inválido");
    }
}

export { CreateStoreService };