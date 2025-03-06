import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

interface StoreUserRequest {
    userId: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    storeId: number;
}

class CreateStoreUserService {
    async execute({ userId, name, email, password, roleId, storeId }: StoreUserRequest) {
        try {
            if (!userId || isNaN(userId)) {
                throw new Error("Invalid user ID");
            }

            if (!name || typeof name !== "string" || name.trim() === "") {
                throw new Error("Invalid name");
            }

            if (!email || !this.isValidEmail(email)) {
                throw new Error("Invalid email");
            }

            if (!password || password.length < 6) {
                throw new Error("Password must be at least 6 characters long");
            }

            if (!roleId || isNaN(roleId)) {
                throw new Error("Invalid role ID");
            }

            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            const userExists = await prismaClient.user.findUnique({
                where: {
                    id: userId,
                },
            });

            if (!userExists) {
                throw new Error("User not found");
            }

            const roleExists = await prismaClient.role.findUnique({
                where: {
                    id: roleId,
                },
            });

            if (!roleExists) {
                throw new Error("Role not found");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            const emailExists = await prismaClient.storeUser.findFirst({
                where: {
                    email: email,
                },
            });

            if (emailExists) {
                throw new Error("Email already in use");
            }

            const passwordHash = await hash(password, 8);

            const storeUser = await prismaClient.storeUser.create({
                data: {
                    createdBy: userId,
                    name: name,
                    email: email,
                    password: passwordHash,
                    roleId: roleId,
                    storeId: storeId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    storeId: true,
                },
            });

            return storeUser;
        } catch (error) {
            console.error("Error creating store user:", error);
            throw new Error(`Failed to create store user. Error: ${error.message}`);
        }
    }
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export { CreateStoreUserService };