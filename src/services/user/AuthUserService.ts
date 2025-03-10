import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { redisClient } from "../../redis.config";

interface AuthRequest {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

class AuthUserService {
    async execute({ email, password, ipAddress, userAgent }: AuthRequest) {
        try {
            if (!email || !this.isValidEmail(email)) {
                throw new Error("Invalid email");
            }

            if (!password || password.length < 6) {
                throw new Error("Invalid password");
            }

            const user = await prismaClient.user.findFirst({
                where: {
                    email: email,
                },
            });

            if (!user) {
                throw new Error("User or password incorrect");
            }

            const passwordMatch = await compare(password, user.password);

            if (!passwordMatch) {
                throw new Error("User or password incorrect");
            }

            const token = sign(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isOwner: user.isOwner,
                },
                process.env.JWT_SECRET,
                {
                    subject: user.id.toString(),
                    expiresIn: "30d",
                }
            );

            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                isOwner: user.isOwner,
                permissions: [],
            };

            await redisClient.set(`user:${user.id}`, JSON.stringify(userData));

            await prismaClient.auditLog.create({
                data: {
                    action: "AUTH_USER",
                    details: JSON.stringify({
                        userId: user.id,
                        email: user.email,
                        isOwner: user.isOwner,
                    }),
                    userId: user.id,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    isOwner: user.isOwner,
                },
            });

            return {
                user: user.id,
                name: user.name,
                email: user.email,
                isOwner: user.isOwner,
                token,
            };
        } catch (error) {
            console.error("Error authenticating user:", error);
            throw new Error(`Failed to authenticate user. Error: ${error.message}`);
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export { AuthUserService };