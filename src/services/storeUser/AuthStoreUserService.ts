import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";

interface UserRequest {
    storeId: number;
    email: string;
    password: string;
}

class AuthStoreUserService {
    async execute({ storeId, email, password }: UserRequest) {
        try {
            if (!storeId || isNaN(storeId)) {
                throw new Error("Invalid store ID");
            }

            if (!email || !this.isValidEmail(email)) {
                throw new Error("Invalid email");
            }

            if (!password || password.length < 6) {
                throw new Error("Invalid password");
            }

            const storeExists = await prismaClient.store.findUnique({
                where: {
                    id: storeId,
                },
            });

            if (!storeExists) {
                throw new Error("Store not found");
            }

            const storeUser = await prismaClient.storeUser.findFirst({
                where: {
                    storeId: storeId,
                    email: email,
                },
            });

            if (!storeUser) {
                throw new Error("User or password incorrect");
            }

            const passwordMatch = await compare(password, storeUser.password);

            if (!passwordMatch) {
                throw new Error("User or password incorrect");
            }

            const token = sign(
                {
                    name: storeUser.name,
                    email: storeUser.email,
                    roleId: storeUser.roleId,
                },
                process.env.JWT_SECRET,
                {
                    subject: storeUser.id.toString(),
                    expiresIn: "30d",
                }
            );

            return {
                storeUserId: storeUser.id,
                name: storeUser.name,
                email: storeUser.email,
                role: storeUser.roleId,
                token,
            };
        } catch (error) {
            console.error("Error authenticating store user:", error);
            throw new Error(`Failed to authenticate store user. Error: ${error.message}`);
        }
    }

    // Função para validar o formato do e-mail
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export { AuthStoreUserService };