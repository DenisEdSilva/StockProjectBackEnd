import prismaClient from "../../prisma";
import { hash } from "bcryptjs"

interface UserRequest {
    userId: number;
    name?: string;
    email?: string;
    password?: string;
    role?: string;
}

class UpdateUserService {
    async execute({ userId, name, email, password, role }: UserRequest) {
        const passwordHash = await hash(password, 8)

        const user = await prismaClient.user.update({
            where: {
                id: userId
            },
            data: {
                ...(name && { name: name }),
                ...(email && { email: email }),
                ...(password && { password: passwordHash }),
                ...(role && { role: role }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })

        return user
    }
}

export { UpdateUserService }