import prismaClient from "../../prisma";
import { hash } from "bcryptjs";

interface UserRequest {
    userId: number;
    storeId: number;
    name?: string;
    email?: string;
    password?: string;
    roleId?: number;
}

class UpdateStoreUserService {
    async execute({ userId, storeId, name, email, password, roleId }: UserRequest) {
        try {
            if (!userId || isNaN(userId)) {
                throw new Error("Invalid user ID");
            }

            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            const userExists = await prismaClient.storeUser.findUnique({
                where: {
                    id: userId,
                    storeId: storeId,
                },
            });

            if (!userExists) {
                throw new Error("User not found");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            if (roleId) {
                const roleExists = await prismaClient.role.findUnique({
                    where: {
                        id: roleId,
                    },
                });

                if (!roleExists) {
                    throw new Error("Role not found");
                }
            }

            if (email) {
                const emailExists = await prismaClient.storeUser.findFirst({
                    where: {
                        email: email,
                        NOT: {
                            id: userId,
                        },
                    },
                });

                if (emailExists) {
                    throw new Error("Email already in use");
                }
            }

            let passwordHash = userExists.password;
            if (password) {
                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters long");
                }
                passwordHash = await hash(password, 8);
            }

            const updatedUser = await prismaClient.storeUser.update({
                where: {
                    id: userId,
                    storeId: storeId,
                },
                data: {
                    name: name || userExists.name,
                    email: email || userExists.email,
                    password: passwordHash,
                    roleId: roleId || userExists.roleId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    storeId: true,
                    createdAt: true,
                    updatedAt: true
                },
            });

            return updatedUser;
        } catch (error) {
            console.error("Error updating store user:", error);
            throw new Error(`Failed to update store user. Error: ${error.message}`);
        }
    }
}

export { UpdateStoreUserService };