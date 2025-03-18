import prismaClient from "../../prisma";
import { 
    ValidationError, 
    NotFoundError 
} from "../../errors";

interface DeleteRequest {
    id: number;
    storeId: number;
    deletedBy: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteStoreUserService {
    async execute(data: DeleteRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const user = await tx.storeUser.findUnique({
                where: { id: data.id, storeId: data.storeId }
            });

            if (!user) throw new NotFoundError("Usuário não encontrado");
            if (user.isDeleted) throw new NotFoundError("Usuário já desativado");

            await tx.storeUser.update({
                where: { id: data.id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: data.deletedBy
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "STORE_USER_DELETE",
                    details: JSON.stringify({
                        deletedBy: data.deletedBy,
                        device: data.userAgent
                    }),
                    userId: data.id,
                    storeId: data.storeId,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return { success: true };
        });
    }
    
    private validateInput(data: DeleteRequest) {
        if (!data.id || isNaN(data.id)) throw new ValidationError("ID inválido");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("ID da loja inválido");
        if (!data.deletedBy || isNaN(data.deletedBy)) throw new ValidationError("ID do executor inválido");
    }
}

export { DeleteStoreUserService };