import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

interface UserRequest {
    userId: number;
    name?: string;
    email?: string;
    password?: string;
}

class UpdateUserService {
    async execute({ userId, name, email, password }: UserRequest) {
        try {
            if (!userId || isNaN(userId)) {
                throw new Error("Invalid user ID");
            }

            const userExists = await prismaClient.user.findUnique({
                where: {
                    id: userId,
                },
            });

            if (!userExists) {
                throw new Error("User not found");
            }

            if (email && !this.isValidEmail(email)) {
                throw new Error("Invalid email");
            }

            if (password && password.length < 6) {
                throw new Error("Password must be at least 6 characters long");
            }

            const passwordHash = password ? await hash(password, 8) : undefined;

            const user = await prismaClient.user.update({
                where: {
                    id: userId,
                },
                data: {
                    ...(name && { name: name }),
                    ...(email && { email: email }),
                    ...(passwordHash && { password: passwordHash }),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            });

            return user;
        } catch (error) {
            console.error("Error updating user:", error);
            throw new Error(`Failed to update user. Error: ${error.message}`);
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export { UpdateUserService };