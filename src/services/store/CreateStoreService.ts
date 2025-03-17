import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface StoreRequest {
    performedByUserId: number;
    name: string;
    city: string;
    state: string;
    zipCode: string;
    ownerId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateStoreService {
    async execute(data: StoreRequest) {
        const auditLogService = new CreateAuditLogService();
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

            await auditLogService.create(
                {
                    action: "STORE_CREATE",
                    details: {
                        storeId: newStore.id,
                        ownerId: data.ownerId,
                        storeName: data.name,
                        storeCity: data.city,
                        storeState: data.state,
                        storeZipCode: data.zipCode
                    },
                    userId: data.performedByUserId,
                    storeId: newStore.id,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                },
                tx
            );

            return newStore;
        }, {
            maxWait: 15000,
            timeout: 15000
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