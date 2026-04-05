import prismaClient from "../../prisma";
import { Prisma } from "@prisma/client";

interface CreateLogRequest {
    action: string;
    storeId?: number;
    userId?: number;
    storeUserId?: number;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    isOwner?: boolean;
}

class CreateAuditLogService {
    async create(data: CreateLogRequest, tx?: Prisma.TransactionClient) {
        const prisma = tx || prismaClient;

        return await prisma.auditLog.create({
            data: {
                action: data.action,
                storeId: data.storeId,
                userId: data.userId,
                storeUserId: data.storeUserId,
                details: data.details || {},
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: data.isOwner || false
            }
        });
    }
}

export { CreateAuditLogService };