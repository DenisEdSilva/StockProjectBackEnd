import { Prisma } from "@prisma/client";
import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface UpdateUserRequest {
    userId: number;
    performedByUserId: number;
    userType: string;
    name?: string;
    email?: string;
    password?: string;
    ipAddress: string;
    userAgent: string;
}

class UpdateUserService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: UpdateUserRequest) {
        if (!Number.isInteger(data.userId) || data.userId !== data.performedByUserId || data.userType !== 'OWNER') {
            throw new ForbiddenError("UnauthorizedAccess");
        }

        return await prismaClient.$transaction(async (tx) => {
            const userExists = await tx.user.findUnique({
                where: { id: data.userId, isDeleted: false },
                select: { email: true }
            });

            if (!userExists) {
                throw new NotFoundError("UserNotFound");
            }

            const updateData: Prisma.UserUpdateInput = { lastActivityAt: new Date() };

            if (data.name) {
                if (data.name.trim().length < 3) throw new ValidationError("InvalidName");
                updateData.name = data.name;
            }

            if (data.email && data.email !== userExists.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.email)) throw new ValidationError("InvalidEmail");

                const emailInUse = await tx.user.findFirst({
                    where: { email: data.email, NOT: { id: data.userId }, isDeleted: false }
                });
                
                if (emailInUse) throw new ConflictError("EmailAlreadyInUse");
                
                updateData.email = data.email;
            }

            if (data.password) {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
                if (!passwordRegex.test(data.password)) throw new ValidationError("InvalidPasswordRequirements");
                
                updateData.password = await hash(data.password, 10);
            }

            const updatedUser = await tx.user.update({
                where: { id: data.userId },
                data: updateData,
                select: { id: true, name: true, email: true }
            });

            await this.activityTracker.track({ tx, userId: data.userId });

            await this.auditLogService.create({
                action: "USER_UPDATED",
                details: { changedFields: Object.keys(updateData) },  
                userId: data.userId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: true
            }, tx);

            return updatedUser;
        });
    }
}

export { UpdateUserService };