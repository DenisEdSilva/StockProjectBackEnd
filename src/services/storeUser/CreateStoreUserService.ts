import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { 
    ValidationError, 
    ConflictError, 
    NotFoundError 
} from "../../errors";
import { CreateStoreUserAccessControlListService } from "./CreateStoreUserAccessControlListService";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { redisClient } from "../../redis.config";

interface StoreUserRequest {
    performedByUserId: number;
    name: string;
    email: string;
    password: string;
    roleId: number;
    storeId: number;
    createdBy: number;
    ipAddress: string;
    userAgent: string;
    isOwner?: boolean;
}

class CreateStoreUserService {
    async execute(data: StoreUserRequest) {
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker();
        const aclService = new CreateStoreUserAccessControlListService();
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const storeExists = await tx.store.findUnique({
                where: { id: data.storeId }
            });

            if (!storeExists) throw new NotFoundError("Loja não encontrada");

            const [emailExists, roleExists] = await Promise.all([
                tx.storeUser.findUnique({ where: { email: data.email }}),
                tx.role.findUnique({ where: { id: data.roleId }})
            ]);

            if (emailExists) throw new ConflictError("Email already registered");
            if (!roleExists) throw new NotFoundError("Role not found");

            const passwordHash = await hash(data.password, 12);

            const user = await tx.storeUser.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: passwordHash,
                    roleId: data.roleId,
                    storeId: data.storeId,
                    createdBy: data.createdBy
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true
                }
            });

            const acl = await aclService.execute({ storeUserId: user.id }, tx);

            await redisClient.setEx(
                `acl:${user.id}`,
                28800,
                JSON.stringify(acl)
            );

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.performedByUserId
            })

            await auditLogService.create({
                action: "CREATE_STORE_USER",
                details: { 
                    storeUserId: user.id,
                    name: user.name,
                    email: user.email,
                    roleId: user.roleId,
                    createdBy: data.createdBy
                },
                userId: data.performedByUserId,
                storeId: data.storeId,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            })

            return user;
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    private validateInput(data: StoreUserRequest) {
        if (!data.name?.trim()) throw new ValidationError("Invalid name");
        if (!this.isValidEmail(data.email)) throw new ValidationError("Invalid email");
        if (data.password.length < 8) throw new ValidationError("Password must be at least 8 characters");
        if (!data.roleId || isNaN(data.roleId)) throw new ValidationError("Invalid role ID");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("Invalid store ID");
    }
}

export { CreateStoreUserService };