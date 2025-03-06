import prismaClient from "../../prisma";
import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken";
import { redisClient } from "../../redis.config";

interface AuthRequest {
    email: string;
    password: string
}

class AuthUserService {
    async execute({ email, password }: AuthRequest) {
        const user = await prismaClient.user.findFirst({
            where: {
                email: email
            }
        })

        if (!user) {
            throw new Error("User or password not found");
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            throw new Error("User or password not found");
        }

        const token = sign({
            id: user.id,
            name: user.name,
            email: user.email,
            isOwner: user.isOwner
        }, process.env.JWT_SECRET, {
            subject: user.id.toString(),
            expiresIn: "30d"
        })

        return {
            user: user.id,
            name: user.name,
            email: user.email,
            isOwner: user.isOwner,
            token
        }
    }
}

export { AuthUserService }