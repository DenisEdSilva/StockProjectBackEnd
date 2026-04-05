import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface DeleteUserRequest {
    id: number;
    performedByUserId: number;
    userType: string;
    ipAddress: string;
    userAgent: string;
}

class DeleteUserService {
    constructor(private auditLogService: CreateAuditLogService) {}

    async execute(data: DeleteUserRequest) {
        if (!Number.isInteger(data.id) || data.id !== data.performedByUserId || data.userType !== 'OWNER') {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return await prismaClient.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: data.id, isDeleted: false },
                select: { id: true, markedForDeletionAt: true }
            });

            if (!user) {
                throw new NotFoundError("UserNotFound");
            }

            if (user.markedForDeletionAt) {
                throw new ConflictError("UserAlreadyMarkedForDeletion");
            }

            const gracePeriodStr = process.env.DELETION_GRACE_PERIOD;
            const gracePeriod = gracePeriodStr ? parseInt(gracePeriodStr, 10) : 30;

            if (!Number.isInteger(gracePeriod) || gracePeriod < 0) {
                throw new ValidationError("InvalidGracePeriodConfig");
            }

            const deletionDate = new Date();
            deletionDate.setMinutes(deletionDate.getMinutes() + gracePeriod);

            await tx.user.update({
                where: { id: data.id },
                data: { 
                    markedForDeletionAt: deletionDate,
                    lastActivityAt: new Date()
                }
            });

            await this.auditLogService.create({
                action: "USER_MARKED_FOR_DELETION",
                details: { scheduledDeletion: deletionDate.toISOString() },
                userId: data.id,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: true
            }, tx);

            return { scheduledDeletion: deletionDate };
        });
    }
}

export { DeleteUserService };