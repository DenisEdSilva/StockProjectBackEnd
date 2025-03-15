import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { redisClient } from "../../redis.config";
import { 
    ValidationError, 
    NotFoundError, 
    UnauthorizedError, 
    ForbiddenError 
} from "../../errors";

interface AuthRequest {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

class AuthUserService {
    async execute({ email, password, ipAddress, userAgent }: AuthRequest) {
        if (!this.isValidEmail(email)) {
            throw new ValidationError("Formato de email inválido");
        }

        if (!password || password.length < 8) {
            throw new ValidationError("Senha deve ter pelo menos 8 caracteres");
        }

        const user = await prismaClient.user.findFirst({
            where: { email },
            include: { 
                ownedStores: {
                    include: {
                        roles: true,
                        storeUsers: {
                            select: { name: true, email: true, role: true },
                            where: { isDeleted: false }
                        },
                        categories: true,
                        products: true,
                        StockMoviment: true
                    }
                } 
            }
        });

        if (user?.markedForDeletionAt) {
            throw new ForbiddenError("Conta marcada para exclusão. Entre em contato com o suporte");
        }

        if (!user) {
            throw new NotFoundError("Credenciais inválidas");
        }

        const passwordMatch = await compare(password, user.password);
        if (!passwordMatch) {
            throw new UnauthorizedError("Credenciais inválidas");
        }

        await prismaClient.user.update({
            where: { id: user.id },
            data: { lastActivityAt: new Date() }
        });

        const token = sign(
            { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                isOwner: user.isOwner 
            },
            process.env.JWT_SECRET!,
            { 
                expiresIn: "30d" 
            }
        );

        await redisClient.set(`user:${user.id}`, JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            isOwner: user.isOwner,
            permissions: []
        }));

        await Promise.all([
            prismaClient.user.update({
                where: { 
                    id: user.id 
                },
                data: { 
                    lastActivityAt: new Date() 
                }
            })
        ])       

        await prismaClient.auditLog.create({
            data: {
                action: "USER_LOGIN",
                details: JSON.stringify({ method: "email/password", device: userAgent }),
                userId: user.id,
                ipAddress,
                userAgent,
                isOwner: user.isOwner
            }
        });

        return { 
            ...user,
            token,
            stores: user.ownedStores
        };
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export { AuthUserService };