import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";

interface UpdateStoreRequest {
    id: number;
    name: string;
    city: string;
    state: string;
    zipCode: string;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateStoreService {
    async execute(data: UpdateStoreRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateUpdate(data);

            const store = await tx.store.findUnique({
                where: { id: data.id },
                select: { ownerId: true }
            });

            if (!store) throw new NotFoundError("Loja não encontrada");
            if (store.ownerId !== data.userId) throw new ForbiddenError("Acesso não autorizado");

            const updatedStore = await tx.store.update({
                where: { id: data.id },
                data: { name: data.name, city: data.city, state: data.state, zipCode: data.zipCode },
                select: { id: true, name: true, city: true, state: true, zipCode: true }
            });

            await tx.auditLog.create({
                data: {
                    action: "STORE_UPDATED",
                    details: JSON.stringify(updatedStore),
                    userId: data.userId,
                    storeId: data.id,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return updatedStore;
        });
    }
    
    private validateUpdate(data: UpdateStoreRequest) {
        if (!data.id || isNaN(data.id)) throw new ValidationError("ID da loja inválido");
        if (data.state && data.state.length !== 2) throw new ValidationError("Sigla do estado deve ter 2 caracteres");
    }
}

export { UpdateStoreService };