import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { ValidationError, ConflictError, NotFoundError } from "../../errors";

interface UserRequest {
    userId: number;
    performedByUserId: number;
    name?: string;
    email?: string;
    password?: string;
    ipAddress: string;
    userAgent: string;
}
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

class UpdateUserService {
    async execute({ userId, performedByUserId, name, email, password, ipAddress, userAgent }: UserRequest) {
        const auditLogService = new CreateAuditLogService();
        return await prismaClient.$transaction(async (tx) => {
            if (performedByUserId !== userId) {
                throw new ValidationError("Apenas o próprio usuário pode atualizar seus dados");
            }

            const executor = await tx.user.findUnique({
                where: { id: performedByUserId },
                select: { isOwner: true }
            });

            if (!executor?.isOwner) {
                throw new ConflictError("Apenas owners podem atualizar dados");
            }
            if (!userId || isNaN(userId)) {
                throw new ValidationError("ID de usuário inválido");
            }

            const userExists = await tx.user.findUnique({
                where: { id: userId }
            });

            if (!userExists) {
                throw new NotFoundError("Usuário não encontrado");
            }

            if (email) {
                if (!this.isValidEmail(email)) {
                    throw new ValidationError("Formato de email inválido");
                }

                const emailUser = await tx.user.findFirst({
                    where: { email, NOT: { id: userId } }
                });

                if (emailUser) {
                    throw new ConflictError("Email já está em uso");
                }
            }

            if (password) {
                if (!this.isPasswordStrong(password)) {
                    throw new ValidationError("A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número");
                }
            }

            const updateData: any = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;
            if (password) updateData.password = await hash(password, 10);

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: updateData,
                select: { id: true, name: true, email: true }
            });

            tx.user.update({
                where: { 
                    id: userId 
                },
                data: { 
                    lastActivityAt: new Date() 
                }
            })

            await auditLogService.create({
                action: "USER_UPDATED",
                details: {
                    changedFields: Object.keys(updateData),
                    oldEmail: userExists.email,
                    newEmail: email || userExists.email
                },  
                userId: performedByUserId,
                ipAddress,
                userAgent,
                isOwnerOverride: true
            });

            return updatedUser;
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isPasswordStrong(password: string): boolean {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /[0-9]/.test(password);
    }
}

export { UpdateUserService };