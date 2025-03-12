import prismaClient from "../../prisma";

interface DeleteRoleRequest {
    id: number;
    userId: number;
    ipAddress: string;
    userAgent: string;
}

class DeleteRoleService {
    async execute({ id, userId, ipAddress, userAgent }: DeleteRoleRequest) {
        try {
            if (!id) {
                throw new Error("Role ID is required");
            }

            const roleExists = await prismaClient.role.findUnique({
                where: {
                    id: id,
                },
            });

            if (!roleExists) {
                throw new Error("Role not found");
            }

            const usersWithRole = await prismaClient.storeUser.findMany({
                where: {
                    roleId: id,
                },
                select: {
                    id: true,
                },
            });

            if (usersWithRole.length > 0) {
                return {
                    message: "Role cannot be deleted because it is still in use by the following users:",
                    userIds: usersWithRole.map((user) => user.id),
                };
            }

            const deletedRole = await prismaClient.role.update({
                where: {
                    id: id,
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            await prismaClient.auditLog.create({
                data: {
                    action: "DELETE_ROLE",
                    details: JSON.stringify({
                        roleId: id,
                        deletedAt: new Date(),
                    }),
                    userId: userId,
                    storeId: roleExists.storeId,
                    ipAddress: ipAddress,
                    userAgent: userAgent,
                },
            });

            return { message: "Role marked as deleted successfully" };
        } catch (error) {
            console.error("Error on soft delete role: ", error);
            throw new Error(`Failed to soft delete role. Error: ${error.message}`);
        }
    }
}

export { DeleteRoleService };