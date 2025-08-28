import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ForbiddenError, UnauthorizedError, ValidationError } from "../../errors";
import { redisClient } from "../../redis.config";
import { ActivityTracker } from "../activity/ActivityTracker";

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
    ownedStores: Array<{ id: number; name: string }>;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
}

interface StoreUserData {
    id: number;
    name: string;
    email: string;
    storeId: number;
    roleId: number;
    role: {
        permissions: Array<{ permission: { action: string; resource: string } }>
    }
    createdAt: Date;
    updatedAt: Date;
}

class SignInService {
    async execute(data: AuthRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            
            if (!this.isValidEmail(data.email)) {
                throw new ValidationError("Formato de email inválido");
            };

            if (!this.isValidPassword(data.password)) {
                throw new ValidationError("Senha deve ter pelo menos 8 caracteres");
            };

            const [ owner, storeUser ] = await Promise.all([
                prismaClient.user.findFirst({
                    where: { 
                        email: data.email 
                    },
                    include: {
                        ownedStores: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }),
                prismaClient.storeUser.findFirst({
                    where: { 
                        email: data.email 
                    },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                })
            ]);

            const user = owner || storeUser

            if (!user) {
                throw new ValidationError("Usuário ou senha inválidos");
            };

            const isPasswordValid = await compare(
                data.password, 
                user.password
            );

            if (!isPasswordValid) {
                throw new UnauthorizedError("Usuário ou senha inválidos");
            };

            if (user === owner && owner.markedForDeletionAt) {
                throw new ForbiddenError("Conta marcada para exclusão. Entre em contato com o suporte");
            };

            if ( user === owner) {
                return await this.handleOwnerSignIn(data, auditLogService, user.isOwner, user);
            }

            

            if ( user === storeUser ) {
                return await this.handleStoreUserSignIn(tx, data, auditLogService, activityTracker, storeUser);
            };

        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }

    private async handleOwnerSignIn(
        data: AuthRequest,
        auditLogService: CreateAuditLogService,
        isOwner: boolean,
        userData: OwnerData
    ) {
        await prismaClient.user.update({
            where: {
                id: userData.id
            },
            data: {
                lastActivityAt: new Date()
            }
        })

        await redisClient.setEx(
            `owner:${userData.id}`,
            30 * 24 * 3600,
            JSON.stringify({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                stores: userData.ownedStores
            })
        )

        const token = sign({
            id: userData.id,
            type: "owner",
            isOwner: isOwner,
            ownedStores: userData.ownedStores || []
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d"
        })

        await auditLogService.create({
            action: "USER_LOGIN",
            details: { 
                userId: userData.id,
                name: userData.name,
                email: userData.email,
                isOwner: isOwner
            },
            userId: userData.id,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwnerOverride: isOwner
        });

        return {
            token,
            id: userData.id,
            name: userData.name,
            email: userData.email,
            isOwner,
            ownedStores: userData.ownedStores
        }
    }

    private async handleStoreUserSignIn(
        tx: any,
        data: AuthRequest,
        auditLogService: CreateAuditLogService,
        activityTracker: ActivityTracker,
        userData: StoreUserData 
    ) {
        if (!userData.role) {
            throw new ForbiddenError("Usuário não possui nenhum cargo atribuído")
        };

        const permissions = userData.role.permissions.map((p) => ({
            action: p.permission.action,
            resource: p.permission.resource
        }));

        const token = sign({
            id: userData.id,
            type: "store",
            storeId: userData.storeId
        }, 
        process.env.JWT_SECRET,
        {
            expiresIn: "30d"
        });

        await redisClient.setEx(
            `store:${userData.storeId}:user:${userData.id}`,
            30 * 24 * 3600,
            JSON.stringify({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                storeId: userData.storeId,
                permissions: permissions
            })
        );


        await activityTracker.track({
            tx,
            storeId: userData.storeId,
        });

        await auditLogService.create({
            action: "STORE_USER_LOGIN",
            details: {
                storeId: userData.storeId,
                email: userData.email,
                name: userData.name
            },
            storeUserId: userData.id,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent
        });

        return {
            token,
            id: userData.id,
            name: userData.name,
            email: userData.email,
            storeId: userData.storeId,
            roleId: userData.roleId,
            permissions: permissions
        };
    }
    
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPassword(password: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }
}

export { SignInService };