import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { 
    ValidationError, 
    NotFoundError, 
    ConflictError, 
    UnauthorizedError
} from "../../errors";
import { CreateStoreUserAccessControlListService } from "./CreateStoreUserAccessControlListService";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";
import { redisClient } from "../../redis.config";

interface UpdateRequest {
    performedByUserId: number;
    id: number;
    storeId: number;
    name?: string;
    email?: string;
    password?: string;
    roleId?: number;
    updatedBy: number;
    ipAddress: string;
    userAgent: string;
}

class UpdateStoreUserService {
    async execute(data: UpdateRequest) {
        const aclService = new CreateStoreUserAccessControlListService();
        const auditLogService = new CreateAuditLogService();
        const activityTracker = new ActivityTracker
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const user = await tx.storeUser.findUnique({
                where: { id: data.id, storeId: data.storeId }
            });

            const store = await tx.store.findUnique({
                where: { id: data.storeId },
                select: { ownerId: true }
            });

            const isOwner = store.ownerId === data.performedByUserId;

            if (!isOwner) {
                const storeUserPerformer = await tx.storeUser.findUnique({
                    where: {
                        id: data.performedByUserId,
                        storeId: data.storeId,
                        isDeleted: false
                    }
                });
                
                if (!storeUserPerformer) {
                    throw new UnauthorizedError("Usuário não autorizado");
                }
            }
            
            if (!store) throw new NotFoundError("Loja não encontrada");

            if (!user) throw new NotFoundError("Usuário não encontrado");
            if (user.isDeleted) throw new NotFoundError("Usuário desativado");

            if (data.email && data.email !== user.email) {
                const emailExists = await tx.storeUser.findUnique({
                    where: { email: data.email }
                });
                if (emailExists) throw new ConflictError("Email já cadastrado");
            }

            if (data.roleId) {
                const roleExists = await tx.role.findUnique({
                    where: { id: data.roleId }
                });
                if (!roleExists) throw new NotFoundError("Perfil não encontrado");
            }

            const passwordHash = data.password
                ? await hash(data.password, 12)
                : user.password;

            const updatedUser = await tx.storeUser.update({
                where: { id: data.id },
                data: {
                    name: data.name || user.name,
                    email: data.email || user.email,
                    password: passwordHash,
                    roleId: data.roleId || user.roleId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleId: true,
                    updatedAt: true
                }
            });

            const acl = await aclService.execute({ storeUserId: data.id });

            await redisClient.setEx(
                `acl:${data.id}`,
                28800,
                JSON.stringify(acl)
            );

            await activityTracker.track({
                tx,
                storeId: data.storeId,
                performedByUserId: data.performedByUserId
            })
            
            await auditLogService.create({
                action: "USER_UPDATE",
                details: {
                    name: data.name || user.name,
                    email: data.email || user.email
                },
                ...(isOwner
                ? { userId: data.performedByUserId } : {
                    storeUserId: data.performedByUserId
                }
                ),
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            });

            return updatedUser;
        }, {
            maxWait: 15000,
            timeout: 15000
        });
    }

    private validateInput(data: UpdateRequest) {
        if (!data.id || isNaN(data.id)) throw new ValidationError("ID inválido");
        if (!data.storeId || isNaN(data.storeId)) throw new ValidationError("ID da loja inválido");
        if (data.email && !this.isValidEmail(data.email)) throw new ValidationError("Formato de email inválido");
        if (data.password && data.password.length < 8) throw new ValidationError("Senha deve ter 8+ caracteres");
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}

export { UpdateStoreUserService };