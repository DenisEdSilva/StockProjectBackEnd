import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";
import { Prisma } from "@prisma/client";

interface AuditLogRequest {
    requestUserId: number;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    storeUserId?: number;
    action?: string;
    page?: number;
    limit?: number;
}

class AuditLogService {
    async execute(storeId: number, filters: AuditLogRequest) {
        return await prismaClient.$transaction(async (tx) => {
            if (filters.requestUserId !== 1) {
                throw new ValidationError("Usuário não autorizado");
            }

            this.validateDates(filters.startDate, filters.endDate);
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            this.validatePagination(page, limit);

            const where: Prisma.AuditLogWhereInput = {
                storeId,
                ...(filters.startDate && filters.endDate && {
                    createdAt: {
                        gte: new Date(filters.startDate),
                        lte: new Date(filters.endDate)
                    }
                }),
                ...(filters.userId && { userId: Number(filters.userId) }),
                ...(filters.storeUserId && { storeUserId: Number(filters.storeUserId) }),
                ...(filters.action && { 
                    action: { 
                        equals: filters.action,
                        mode: 'insensitive' as Prisma.QueryMode
                    } 
                })
            };

            const [logs, total] = await Promise.all([
                tx.auditLog.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        storeUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: "desc" }
                }),
                tx.auditLog.count({ where })
            ]);

            if (logs.length === 0) {
                throw new NotFoundError("Nenhum registro encontrado");
            }

            const formattedLogs = logs.map(log => ({
                ...log,
                action: this.translateAction(log.action),
                userName: this.getUserName(log) || `Usuário da Loja ${log.storeUserId}`,
                formattedDetails: this.formatDetails(log.action, log.details),
                createdAt: log.createdAt.toISOString()
            }));

            const users = this.getDistinctUsers(logs)

            const actions = [... new Set(logs.map(log => log.action))]

            return {
                data: formattedLogs,
                users,
                actions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        });
    }

    private getUserName = (log: any): string => {
        if (log.user) {
            return log.user.name;
        }
        if (log.storeUser) {
            return log.storeUser.name;
        }
        return 'Usuário desconhecido';
    }

    private getDistinctUsers(logs: any[]): any[] {
        const userMap = new Map<string, any>();
    
        logs.forEach(log => {
            if (log.user && log.user.name) {
                const uniqueKey = `owner_${log.user.id || log.userId}`;
                if (!userMap.has(uniqueKey)) {
                    userMap.set(uniqueKey, {
                        id: log.user.id || log.userId,
                        name: log.user.name,
                        email: log.user.email || '',
                        type: 'owner'
                    });
                }
            }
            
            if (log.storeUser && log.storeUser.name) {
                const uniqueKey = `store_${log.storeUser.id || log.storeUserId}`;
                if (!userMap.has(uniqueKey)) {
                    userMap.set(uniqueKey, {
                        id: log.storeUser.id || log.storeUserId,
                        name: log.storeUser.name,
                        email: log.storeUser.email || '',
                        type: 'store'
                    });
                }
            }
        });
    
        return Array.from(userMap.values());
    }

    private translateAction(action: string): string {
        const actionTranslations: Record<string, string> = {
            'ROLE_CREATE': 'Criação de Cargo',
            'ROLE_UPDATE': 'Atualização de Cargo',
            'CREATE_STORE_USER': 'Criação de Usuário da Loja',
            'UPDATE_STORE_USER': 'Atualização de Usuário da Loja',
            'CATEGORY_CREATE': 'Criação de Categoria',
            'CATEGORY_UPDATE': 'Atualização de Categoria',
            'PRODUCT_CREATE': 'Criação de Produto',
            'PRODUCT_UPDATE': 'Atualização de Produto',
            'STOCK_MOVIMENT_CREATE': 'Movimentação de Estoque',
            'STOCK_TRANSFER': 'Transferência de Estoque',
            'STOCK_REVERT': 'Reversão de Estoque',
        };
    
        return actionTranslations[action] || action;
    }

    private formatDetails(action: string, details: string): string {
        try {
            const parsed = JSON.parse(details);
            
            switch(action) {
                case 'ROLE_UPDATE':
                    return `Cargo: ${parsed.name}\nPermissões: ${parsed.permissionIds?.join(', ')}`;
                case 'USER_CREATE':
                    return `Email: ${parsed.email}\nTipo: ${parsed.type}`;
                case 'PRODUCT_UPDATE':
                    return `Produto: ${parsed.name}\nPreço: R$ ${parsed.price}\nEstoque: ${parsed.stock}`;
                default:
                    return Object.entries(parsed)
                        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                        .join('\n');
            }
        } catch {
            return details;
        }
    }

    private validateDates(start?: Date, end?: Date) {
        if (start && end && start > end) {
            throw new ValidationError("Data inicial maior que data final");
        }
    }

    private validatePagination(page: number, limit: number) {
        if (page < 1 || limit < 1 || limit > 100) {
            throw new ValidationError("Parâmetros de paginação inválidos");
        }
    }
}

export { AuditLogService };