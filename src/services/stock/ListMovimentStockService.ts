import { Prisma } from "@prisma/client";
import { parseISO, isValid } from "date-fns";
import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";
import { ActivityTracker } from "../activity/ActivityTracker";

interface ListMovimentParams {
    storeId: string | number;
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
    page?: string | number;
    pageSize?: string | number;
    type?: string;
    productId?: string | number;
    createdBy?: string | number;
    destinationStoreId?: string | number;
    startDate?: string;
    endDate?: string;
    ipAddress?: string;
    userAgent?: string;
}

class ListMovimentStockService {
    constructor(
        private auditLogService: CreateAuditLogService,
        private activityTracker: ActivityTracker
    ) {}

    async execute(params: ListMovimentParams) {
        const data = this.validateAndTransform(params);

        const store = await prismaClient.store.findUnique({
            where: { id: data.storeId, isDeleted: false },
            select: { id: true, ownerId: true }
        });

        if (!store) throw new NotFoundError("StoreNotFound");

        this.checkOwnership(data, store.ownerId);

        const whereClause = this.buildWhereClause(data);

        const [movements, total] = await Promise.all([
            prismaClient.stockMoviment.findMany({
                where: whereClause,
                select: {
                    id: true,
                    type: true,
                    stock: true,
                    previousStock: true,
                    destinationStoreId: true,
                    createdBy: true,
                    createdAt: true,
                    product: { select: { name: true, sku: true, banner: true } },
                    destinationStore: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (data.page - 1) * data.pageSize,
                take: data.pageSize
            }),
            prismaClient.stockMoviment.count({ where: whereClause })
        ]);

        await this.activityTracker.track({
            storeId: data.storeId,
            userId: data.performedByUserId
        });

        await this.auditLogService.create({
            action: "STOCK_MOVIMENT_LIST",
            details: { filters: data },
            userId: data.userType === 'OWNER' ? data.performedByUserId : undefined,
            storeUserId: data.userType === 'STORE_USER' ? data.performedByUserId : undefined,
            storeId: data.storeId,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            isOwner: data.userType === 'OWNER'
        });

        return {
            data: movements,
            pagination: {
                page: data.page,
                pageSize: data.pageSize,
                total,
                totalPages: Math.ceil(total / data.pageSize)
            }
        };
    }

    private validateAndTransform(p: ListMovimentParams) {
        const storeId = Number(p.storeId);
        const page = Number(p.page) || 1;
        const pageSize = Number(p.pageSize) || 10;
        const productId = p.productId ? Number(p.productId) : undefined;
        const destinationStoreId = p.destinationStoreId ? Number(p.destinationStoreId) : undefined;
        const createdBy = p.createdBy ? Number(p.createdBy) : undefined;

        if (isNaN(storeId)) throw new ValidationError("InvalidStoreId");
        if (page <= 0 || pageSize <= 0) throw new ValidationError("InvalidPagination");
        
        if (p.type && !['IN', 'OUT', 'TRANSFER'].includes(p.type)) {
            throw new ValidationError("InvalidMovementType");
        }

        const startDate = p.startDate ? parseISO(p.startDate) : undefined;
        const endDate = p.endDate ? parseISO(p.endDate) : undefined;

        if (startDate && !isValid(startDate)) throw new ValidationError("InvalidStartDate");
        if (endDate && !isValid(endDate)) throw new ValidationError("InvalidEndDate");

        return {
            ...p,
            storeId,
            page,
            pageSize,
            productId,
            destinationStoreId,
            createdBy,
            startDate,
            endDate
        };
    }

    private checkOwnership(data: any, storeOwnerId: number) {
        if (data.userType === 'OWNER' && storeOwnerId !== data.performedByUserId) {
            throw new ForbiddenError("UnauthorizedStoreAccess");
        }
        if (data.userType === 'STORE_USER' && data.tokenStoreId !== data.storeId) {
            throw new ForbiddenError("UnauthorizedStoreAccess");
        }
    }

    private buildWhereClause(data: any) {
        const where: Prisma.StockMovimentWhereInput = {
            storeId: data.storeId,
            isDeleted: false
        };

        if (data.type) where.type = data.type as any;
        if (data.productId) where.productId = data.productId;
        if (data.createdBy) where.createdBy = data.createdBy;
        if (data.destinationStoreId) where.destinationStoreId = data.destinationStoreId;

        if (data.startDate || data.endDate) {
            where.createdAt = {
                ...(data.startDate && { gte: data.startDate }),
                ...(data.endDate && { lte: data.endDate })
            };
        }

        return where;
    }
}

export { ListMovimentStockService };