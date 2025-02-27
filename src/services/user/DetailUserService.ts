import prismaClient from "../../prisma";

interface UserRequest {
    userId: number;
}

class DetailUserService {
    async execute({ userId }: UserRequest) {
        const user = await prismaClient.user.findFirst({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })


        return user;
    }
}

export { DetailUserService }