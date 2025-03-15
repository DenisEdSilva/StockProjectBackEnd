import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { 
    ValidationError, 
    NotFoundError, 
    ConflictError 
} from "../../errors";

interface UpdateRequest {
    id: number;
    storeId: number;
    name?: string;
    email?: string;
    password?: string;
    roleId?: number;
    updatedBy: number;
}

class UpdateStoreUserService {
    private validateInput(data: UpdateRequest) {
        if (!data.id || isNaN(data.id)) throw new ValidationError("ID inválido");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("ID da loja inválido");
        if (data.email && !this.isValidEmail(data.email)) throw new ValidationError("Formato de email inválido");
        if (data.password && data.password.length < 8) throw new ValidationError("Senha deve ter 8+ caracteres");
    }

    async execute(data: UpdateRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const user = await tx.storeUser.findUnique({
                where: { id: data.id, storeId: data.storeId }
            });

            if (!user) throw new NotFoundError("Usuário não encontrado");
            if (user.isDeleted) throw new NotFoundError("Usuário desativado");

            if (data.email && data.email !== user.email) {
                const emailExists = await tx.storeUser.findUnique({
                    where: { email: data.email }
                });
                if (emailExists) throw new ConflictError("Email já cadastrado");
            }

            if (data.roleId) {
                const roleExists = await tx.role.findUnique({
                    where: { id: data.roleId }
                });
                if (!roleExists) throw new NotFoundError("Perfil não encontrado");
            }

            const passwordHash = data.password
                ? await hash(data.password, 12)
                : user.password;

            const updatedUser = await tx.storeUser.update({
                where: { id: data.id },
                data: {
                    name: data.name || user.name,
                    email: data.email || user.email,
                    password: passwordHash,
                    roleId: data.roleId || user.roleId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    updatedAt: true
                }
            });

            await tx.auditLog.create({
                data: {
                    action: "STORE_USER_UPDATED",
                    details: `Usuário ${data.id} atualizado`,
                    userId: data.updatedBy,
                    storeId: data.storeId
                }
            });

            return updatedUser;
        });
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

export { UpdateStoreUserService };