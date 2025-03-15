import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { ConflictError, ValidationError } from "../../errors";

interface UserRequest {
    name: string;
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

class CreateUserService {
    async execute(data: UserRequest) {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);
            
            const userAlreadyExists = await prismaClient.user.findFirst({
                where: {
                    email: data.email,
                },
            });

            if (userAlreadyExists) {
                throw new ConflictError("User already exists");
            };

            const passwordHash = await hash(data.password, 8);

            const newUser = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: passwordHash,
                    isOwner: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isOwner: true
                }
            });

            return newUser
        });
    }
    private validateInput(data: UserRequest) {
        if (!data.name?.trim()) throw new ValidationError("Nome de usuario inválido");
        if (data.name.trim().length < 3) throw new Error("Nome deve possuir pelo menos 3 caracteres");
        if (!data.email?.trim()) throw new Error("Email invalido");
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error("Formato de email invalido");
        }
        if (!data.password?.trim()) throw new Error("Senha invalida");
        if (!this.isValidPassword(data.password)) throw new Error("A senha deve conter letras e números");
        if (!data.password || data.password.length < 6) {
            throw new Error("Senha deve possuir pelo menos 6 caracteres");
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPassword(password: string): boolean {
        return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
    }
}

export { CreateUserService };