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
        const storeUser = await prismaClient.storeUser.findFirst({
            where: {
                storeId: storeId,
                email: email
            }        
        })

        if (!storeUser) {
            throw new Error("User or password not found");
        }

        const passwordMatch = await compare(password, storeUser.password);

        if (!passwordMatch) {
            throw new Error("User or password not found");
        }

        const token = sign({
            name: storeUser.name,
            email: storeUser.email,
            role: storeUser.role,
        }, process.env.JWT_SECRET, {
            subject: storeUser.id.toString(),
            expiresIn: "30d"
        })

        return ({
            storeUserId: storeUser.id,
            name: storeUser.name,
            email: storeUser.email,
            role: storeUser.role,
            token
        })
    }
}

export { AuthStoreUserService };