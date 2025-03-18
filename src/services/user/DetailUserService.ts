import { NotFoundError, ValidationError } from "../../errors";
import prismaClient from "../../prisma";

interface UserRequest {
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DetailUserService {
    async execute({ userId, ipAddress, userAgent }: UserRequest) {
        if (!userId || isNaN(userId)) {
            throw new ValidationError("Invalid user ID");
        }

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                ownedStores: true
            },
        });


        if (!user) {
            throw new NotFoundError("Usuário não encontrado");
        }

        await prismaClient.auditLog.create({
            data: {
                action: "DETAIL_USER",
                details: JSON.stringify({
                    userId: user.id,
                    name: user.name,
                    email: user.email
                }),
                userId: user.id,
                ipAddress: ipAddress,
                userAgent: userAgent,
                isOwner: true
            },
        });

        return user;
    }
}

export { DetailUserService };