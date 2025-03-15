import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { ValidationError, ConflictError, NotFoundError } from "../../errors";

interface UserRequest {
    userId: number;
    name?: string;
    email?: string;
    password?: string;
    ipAddress: string;
    userAgent: string;
}

class UpdateUserService {
    async execute({ userId, name, email, password, ipAddress, userAgent }: UserRequest) {
        return await prismaClient.$transaction(async (tx) => {
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

            await tx.auditLog.create({
                data: {
                    action: "USER_UPDATED",
                    details: JSON.stringify({
                        changedFields: Object.keys(updateData),
                        oldEmail: userExists.email,
                        newEmail: email || userExists.email
                    }),
                    userId: updatedUser.id,
                    ipAddress,
                    userAgent,
                    isOwner: true
                }
            });

            return updatedUser;
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