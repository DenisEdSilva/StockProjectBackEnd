import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { 
    ValidationError, 
    NotFoundError, 
    ConflictError, 
    ForbiddenError
} from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { redisClient } from "../../redis.config";

interface UpdateRequest {
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    id: number;
    storeId: number;
    name?: string;
    email?: string;
    password?: string;
    roleId?: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateStoreUserService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: UpdateRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const user = await tx.storeUser.findUnique({
                where: { 
                    id: data.id, 
                    storeId: data.storeId, 
                    isDeleted: false 
                },
                include: { store: { select: { ownerId: true } } }
            });

            if (!user) {
                throw new NotFoundError("StoreUserNotFound");
            }

            if (data.userType === 'OWNER' && user.store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }

            if (data.email && data.email !== user.email) {
                const emailInUse = await tx.storeUser.findFirst({
                    where: { 
                        email: data.email, 
                        storeId: data.storeId, 
                        isDeleted: false 
                    }
                });

                if (emailInUse) {
                    throw new ConflictError("EmailAlreadyRegisteredInThisStore");
                }
            }

            if (data.roleId && data.roleId !== user.roleId) {
                const role = await tx.role.findFirst({
                    where: { 
                        id: data.roleId, 
                        storeId: data.storeId, 
                        isDeleted: false 
                    }
                });

                if (!role) {
                    throw new NotFoundError("RoleNotFoundInThisStore");
                }
            }

            const passwordHash = data.password 
                ? await hash(data.password, 10) 
                : undefined;

            const updatedUser = await tx.storeUser.update({
                where: { id: data.id },
                data: {
                    name: data.name || undefined,
                    email: data.email || undefined,
                    password: passwordHash,
                    roleId: data.roleId || undefined
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    storeId: true,
                    updatedAt: true
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "STORE_USER_UPDATE",
                details: { 
                    targetUserId: data.id,
                    updatedFields: Object.keys(data).filter(k => data[k as keyof UpdateRequest] !== undefined)
                },
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            try {
                await redisClient.del(`store:${data.storeId}:user:${data.id}`);
            } catch (e) {}

            return updatedUser;
        });
    }

    private validateInput(data: UpdateRequest) {
        if (!Number.isInteger(data.id)) {
            throw new ValidationError("InvalidUserId");
        }
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new ValidationError("InvalidEmailFormat");
        }
        if (data.password && data.password.length < 8) {
            throw new ValidationError("PasswordTooShort");
        }
    }
}

export { UpdateStoreUserService };