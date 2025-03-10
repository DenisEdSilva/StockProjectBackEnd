import prismaClient from "../../prisma";

interface UserRequest {
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DetailUserService {
    async execute({ userId, ipAddress, userAgent }: UserRequest) {
        try {
            if (!userId || isNaN(userId)) {
                throw new Error("Invalid user ID");
            }

            const user = await prismaClient.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    isOwner: true,
                },
            });

            if (!user) {
                throw new Error("User not found");
            }

            await prismaClient.auditLog.create({
                data: {
                    action: "DETAIL_USER",
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
            console.error("Error fetching user details:", error);
            throw new Error(`Failed to fetch user details. Error: ${error.message}`);
        }
    }
}

export { DetailUserService };