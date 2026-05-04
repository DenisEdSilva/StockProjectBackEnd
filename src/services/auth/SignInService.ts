import { Prisma } from "@prisma/client";
import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../../errors";
import { AccessControlProvider } from "../../shared/AccessControlProvider";
import { redisClient } from "../../redis.config";

interface AuthRequest {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

interface OwnerData {
    id: number;
    name: string;
    email: string;
    isOwner: boolean;
    markedForDeletionAt: Date | null;
    ownedStores: Array<{ 
        id: number; 
        name: string; 
        isDeleted: boolean 
    }>;
}

interface StoreUserData {
    id: number;
    name: string;
    email: string;
    roleId: number;
    storeId: number;
    role: {
        permissions: Array<{ 
            permission: { 
                action: string; 
                resource: string;
            } 
        }>;
    } | null;
}

class SignInService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker,
        private accessControlProvider: AccessControlProvider
    ) {}

    async execute(data: AuthRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {

            const [owner, storeUser] = await Promise.all([
                tx.user.findUnique({
                    where: { email: data.email, isDeleted: false },
                    include: {
                        ownedStores: {
                            where: { isDeleted: false },
                            select: { id: true, name: true, isDeleted: true }
                        }
                    }
                }),
                tx.storeUser.findFirst({
                    where: { 
                        email: data.email, 
                        isDeleted: false, 
                        store: { 
                            isDeleted: false 
                        } 
                    },
                    include: {
                        store: true,
                        role: {
                            include: {
                                permissions: { 
                                    include: { permission: true } 
                                }
                            }
                        }
                    }
                })
            ]);

            const user = owner || storeUser;
            
            if (!user) {
                throw new UnauthorizedError("InvalidCredentials");
            }

            const isPasswordValid = await compare(data.password, user.password);
            
            if (!isPasswordValid) {
                throw new UnauthorizedError("InvalidCredentials");
            }

            if ("isOwner" in user && user.isOwner) {
                return await this.handleOwnerSignIn(tx, data, user as OwnerData);
            }

            return await this.handleStoreUserSignIn(tx, data, user as StoreUserData);
        });
    }

    private async handleOwnerSignIn(
        tx: Prisma.TransactionClient,
        data: AuthRequest,
        userData: OwnerData
    ) {
        if (userData.markedForDeletionAt) {
            throw new ForbiddenError("AccountMarkedForDeletion");
        }

        await this.activityTracker.track({
            tx,
            ownerId: userData.id
        });

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("ServerConfigurationError");
        }

        const token = sign({
            id: userData.id,
            type: 'OWNER',
            isOwner: true,
            ownedStores: userData.ownedStores
        }, jwtSecret, { expiresIn: "30d" });

        try {
            if (redisClient.isOpen) {
                await redisClient.setEx(
                    `owner:${userData.id}`,
                    30 * 24 * 3600,
                    JSON.stringify({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        stores: userData.ownedStores
                    })
                );
            }
        } catch (error) {}

        await this.auditLogService.create({
            action: "USER_LOGIN",
            userId: userData.id,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner: true
        }, tx);

        return { 
            token, 
            user: {
                id: userData.id, 
                name: userData.name, 
                email: userData.email, 
                type: 'OWNER',
                ownedStores: userData.ownedStores 
            }
        };
    }

    private async handleStoreUserSignIn(
        tx: Prisma.TransactionClient,
        data: AuthRequest,
        userData: StoreUserData
    ) {
        if (!userData.role) {
            throw new ForbiddenError("NoRoleAssigned");
        }

        const acl = await this.accessControlProvider.uintToACL(userData.id, tx);
        const permissions = acl.permissions;

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("ServerConfigurationError");
        }

        const token = sign({
            id: userData.id,
            type: 'STORE_USER',
            storeId: userData.storeId
        }, jwtSecret, { expiresIn: "30d" });

        try {
            if (redisClient.isOpen) {
                await redisClient.setEx(
                    `store:${userData.storeId}:user:${userData.id}`,
                    30 * 24 * 3600,
                    JSON.stringify({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        storeId: userData.storeId,
                        permissions
                    })
                );
            }
        } catch (error) {}

        await this.activityTracker.track({
            tx,
            storeId: userData.storeId,
            storeUserId: userData.id
        });

        await this.auditLogService.create({
            action: "STORE_USER_LOGIN",
            storeUserId: userData.id,
            storeId: userData.storeId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner: false
        }, tx);

        return { 
            token, 
            user: {
                id: userData.id, 
                name: userData.name, 
                email: userData.email, 
                type: 'STORE_USER',
                storeId: userData.storeId, 
                roleId: userData.roleId, 
                permissions 
            }
        };
    }

    private validateInput(data: AuthRequest) {
        if (!data.email || typeof data.email !== "string") {
            throw new ValidationError("InvalidEmailFormat");
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new ValidationError("InvalidEmailFormat");
        }

        if (!data.password || typeof data.password !== "string") {
            throw new ValidationError("InvalidPasswordFormat");
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(data.password)) {
            throw new ValidationError("InvalidPasswordRequirements");
        }
    }
}

export { SignInService };