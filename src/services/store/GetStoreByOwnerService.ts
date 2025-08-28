import prismaClient from "../../prisma";
import { ValidationError } from "../../errors";

export class GetStoreByOwnerService {
    async execute(ownerId: number) {
        return await prismaClient.$transaction(async (tx) => {
            if (!ownerId || isNaN(ownerId)) throw new ValidationError("ID do proprietário inválido");

            return await tx.store.findMany({ 
                where: { 
                    ownerId: ownerId, 
                    isDeleted: false 
                }
            });
        })
    }
}

export default new GetStoreByOwnerService();