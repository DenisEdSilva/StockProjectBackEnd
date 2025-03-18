import prismaClient from "../../prisma";
import { ValidationError } from "../../errors";
import { Prisma } from "@prisma/client";

interface AuditLogData {
    action: string;
    details?: Record<string, any> | string;
    userId?: number;
    storeUserId?: number;
    storeId?: number;
    ipAddress: string;
    userAgent: string;
    isOwnerOverride?: boolean;
}

class CreateAuditLogService {
    async create(data: AuditLogData, tx?: Prisma.TransactionClient) {
        const prisma = tx || prismaClient;

        if (!data.action?.trim()) throw new ValidationError("Ação não especificada");
        if (!data.ipAddress || !data.userAgent) {
            throw new ValidationError("IP e userAgent são obrigatórios");
        }
        if (!data.userId && !data.storeUserId) {
            throw new ValidationError("Deve fornecer userId ou storeUserId");
        }

        const isOwner = data.isOwnerOverride ?? await this.determineOwnership(
            data.userId, 
            data.storeId, 
            prisma
        );

        const logData = this.buildLogData(data, isOwner);

        return await prisma.auditLog.create({
            data: logData,
            select: { id: true, action: true, createdAt: true }
        });
    }

    private async determineOwnership(
        userId?: number, 
        storeId?: number, 
        prisma?: Prisma.TransactionClient
    ): Promise<boolean> {
        if (!userId || !storeId) return false;
        
        const store = await (prisma || prismaClient).store.findUnique({
            where: { id: storeId },
            select: { ownerId: true }
        });

        return store?.ownerId === userId;
    }

    private buildLogData(
        data: AuditLogData, 
        isOwner: boolean
    ): Prisma.AuditLogCreateInput {
        const baseData: Prisma.AuditLogCreateInput = {
            action: data.action,
            details: data.details ? JSON.stringify(data.details) : null,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner
        };
    
        if (data.storeId) {
            baseData.store = { connect: { id: data.storeId } };
        }

        if (data.storeUserId) {
            baseData.storeUser = { connect: { id: data.storeUserId } };
        } else if (data.userId) {
            baseData.user = { connect: { id: data.userId } };
        }
    
        return baseData;
    }
}

export { CreateAuditLogService };