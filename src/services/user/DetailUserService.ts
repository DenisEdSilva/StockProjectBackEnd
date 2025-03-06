import prismaClient from "../../prisma";

interface UserRequest {
    userId: number;
}

class DetailUserService {
    async execute({ userId }: UserRequest) {
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

            return user;
        } catch (error) {
            console.error("Error fetching user details:", error);
            throw new Error(`Failed to fetch user details. Error: ${error.message}`);
        }
    }
}

export { DetailUserService };