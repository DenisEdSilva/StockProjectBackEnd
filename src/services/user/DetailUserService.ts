import { NotFoundError, ForbiddenError } from "../../errors";
import prismaClient from "../../prisma";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface DetailUserRequest {
    userId: number;
    userType: string;
    ipAddress: string;
    userAgent: string;
}

class DetailUserService {
    constructor(private auditLogService: CreateAuditLogService) {}

    async execute(data: DetailUserRequest) {
        if (!Number.isInteger(data.userId) || data.userType !== 'OWNER') {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return await prismaClient.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: data.userId, isDeleted: false },
                select: {
                    id: true, 
                    name: true, 
                    email: true,
                    ownedStores: {
                        where: { isDeleted: false },
                        select: { id: true, name: true }
                    }
                },
            });

            if (!user) {
                throw new NotFoundError("UserNotFound");
            }

            await this.auditLogService.create({
                action: "USER_DETAILS_ACCESSED",
                userId: user.id,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: true
            }, tx);

            return user;
        });
    }
}

export { DetailUserService };