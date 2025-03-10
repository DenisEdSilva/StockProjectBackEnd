import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

interface UserRequest {
    name: string;
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

class CreateUserService {
    async execute({ name, email, password, ipAddress, userAgent }: UserRequest) {
        try {
            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid name");
            }

            if (!email || !this.isValidEmail(email)) {
                throw new Error("Invalid email");
            }

            if (!password || password.length < 6) {
                throw new Error("Password must be at least 6 characters long");
            }

            const userAlreadyExists = await prismaClient.user.findFirst({
                where: {
                    email: email,
                },
            });

            if (userAlreadyExists) {
                throw new Error("User already exists");
            }

            const passwordHash = await hash(password, 8);

            const user = await prismaClient.user.create({
                data: {
                    name: name,
                    email: email,
                    password: passwordHash,
                    isOwner: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isOwner: true,
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "CREATE_USER",
                    details: JSON.stringify({
                        userId: user.id,
                        name: user.name,
                        email: user.email,
                    }),
                    userId: user.id,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                    isOwner: user.isOwner,
                },
            });

            return user;
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error(`Failed to create user. Error: ${error.message}`);
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export { CreateUserService };