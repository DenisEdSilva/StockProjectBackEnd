import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { ValidationError, ConflictError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { redisClient } from "../../redis.config";

interface CreateStoreUserRequest {
    performedByUserId: number;
    userType: string;
    tokenStoreId?: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    storeId: number;
    ipAddress: string;
    userAgent: string;
}

class CreateStoreUserService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(data: CreateStoreUserRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const store = await tx.store.findUnique({
                where: { id: data.storeId, isDeleted: false },
                select: { ownerId: true }
            });

            if (!store) {
                throw new NotFoundError("StoreNotFound");
            }

            if (data.userType === 'OWNER' && store.ownerId !== data.performedByUserId) {
                throw new ForbiddenError("UnauthorizedStoreAccess");
            }

            if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
                throw new ForbiddenError("UnauthorizedStoreAccess");
            }

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

            const [localEmailExists, globalEmailExists] = await Promise.all([
                tx.storeUser.findUnique({
                    where: { email_storeId: { email: data.email, storeId: data.storeId } }
                }),
                tx.user.findUnique({ where: { email: data.email } })
            ]);

            if (localEmailExists || globalEmailExists) {
                throw new ConflictError("EmailAlreadyRegistered");
            }

            const passwordHash = await hash(data.password, 10);

            const user = await tx.storeUser.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: passwordHash,
                    roleId: data.roleId,
                    storeId: data.storeId,
                    createdBy: data.performedByUserId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    storeId: true
                }
            });

            await this.activityTracker.track({
                tx,
                storeId: data.storeId,
                userId: data.performedByUserId
            });

            await this.auditLogService.create({
                action: "STORE_USER_CREATE",
                details: { 
                    newUserId: user.id, 
                    roleId: data.roleId, 
                    email: data.email 
                },
                userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
                storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.userType === 'OWNER'
            }, tx);

            try {
                await redisClient.del(`store:${data.storeId}:users`);
            } catch (e) {}

            return user;
        });
    }

    private validateInput(data: CreateStoreUserRequest) {
        if (!data.name?.trim()) {
             throw new ValidationError("InvalidName");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw new ValidationError("InvalidEmail");
        }
        if (data.password.length < 8) {
            throw new ValidationError("PasswordTooShort");
        }
        if (!Number.isInteger(data.roleId)) {
            throw new ValidationError("InvalidRoleId");
        }
        if (!Number.isInteger(data.storeId)) {
            throw new ValidationError("InvalidStoreId");
        }
    }
}

export { CreateStoreUserService };