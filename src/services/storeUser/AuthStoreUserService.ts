import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { redisClient } from "../../redis.config";
import { 
    ValidationError,
    UnauthorizedError 
} from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface AuthRequest {
    storeId: number;
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

interface AuthResponse{
    id: number;
    name: string;
    email: string;
    roleId: number;
    storeId: number;
    permissions: Array<{ action: string; resource: string }>;
    createdBy: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    isDeleted: boolean;
    token: string;
}

class AuthStoreUserService {
    async execute(data: AuthRequest): Promise<AuthResponse> {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const storeUser = await tx.storeUser.findFirst({
                where: {
                    storeId: data.storeId,
                    email: data.email,
                    isDeleted: false
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
            });

            if (!storeUser) throw new UnauthorizedError("Invalid credentials");
            
            const passwordValid = await compare(data.password, storeUser.password);
            if (!passwordValid) throw new UnauthorizedError("Invalid credentials");
            
            const permissions = storeUser.role.permissions.map(rp => ({
                action: rp.permission.action,
                resource: rp.permission.resource
            })) || [];

            const token = sign(
                { 
                    id: storeUser.id, 
                    type: 'store',
                    storeId: storeUser.storeId
                },
                process.env.JWT_SECRET!,
                { 
                    expiresIn: "8h" 
                }
            );

            await redisClient.setEx(
                `store:${storeUser.storeId}:user:${storeUser.id}`,
                8 * 3600,
                JSON.stringify({
                    id: storeUser.id,
                    storeId: storeUser.storeId,
                    permissions: permissions
                })
            );

            await activityTracker.track({
                tx,
                storeId: data.storeId
            })

            await auditLogService.create({
                action: "STORE_USER_LOGIN",
                details: {
                    storeId: storeUser.storeId,
                    email: storeUser.email,
                    name: storeUser.name
                },
                storeUserId: storeUser.id,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            return {
                id: storeUser.id,
                name: storeUser.name,
                email: storeUser.email,
                roleId: storeUser.roleId,
                storeId: storeUser.storeId,
                createdBy: storeUser.createdBy,
                createdAt: storeUser.createdAt,
                updatedAt: storeUser.updatedAt,
                deletedAt: storeUser.deletedAt,
                isDeleted: storeUser.isDeleted,
                permissions,
                token
            };
        }, {
            maxWait: 15000,
            timeout: 15000 
        });
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    private validateInput({ storeId, email, password }: AuthRequest) {
        if (!storeId || isNaN(storeId)) throw new ValidationError("Invalid store ID");
        if (!this.isValidEmail(email)) throw new ValidationError("Invalid email format");
        if (password.length < 8) throw new ValidationError("Password must be at least 8 characters");
    }
}

export { AuthStoreUserService };