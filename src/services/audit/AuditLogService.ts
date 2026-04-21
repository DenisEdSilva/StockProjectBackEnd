import prismaClient from "../../prisma";
import { ValidationError, NotFoundError, ForbiddenError } from "../../errors";
import { Prisma } from "@prisma/client";

interface AuditLogRequest {
    performedByUserId: number;
    userType: 'OWNER' | 'STORE_USER';
    tokenStoreId?: number;
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
            if (filters.performedByUserId !== 1) {
                throw new ValidationError("Usuário não autorizado");
            }

            const store = await prismaClient.store.findUnique({
                where: { id: storeId, isDeleted: false },
                select: { ownerId: true }
            });

            if (filters.userType === 'OWNER' && store.ownerId !== filters.performedByUserId) {
                throw new ForbiddenError("UnauthorizedAccess");
            }
            if (filters.userType === 'STORE_USER' && filters.tokenStoreId !== storeId) {
                throw new ForbiddenError("UnauthorizedAccess");
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

            const formattedLogs = logs.map(log => {
                const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;

                return {
                    ...log,
                    actionLabel: this.translateAction(log.action),
                    description: this.buildNarrative(log.action, details),
                    userName: this.getUserName(log),
                    createdAt: log.createdAt.toISOString()
                };
            });

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

    private buildNarrative(action: string, details: any): string {
        if (!details) return "Realizou uma operação no sistema";

        switch (action) {
            case 'STOCK_MOVIMENT_CREATE':
                const type = details.type === 'IN' ? 'Entrada' : 'Saída';
                return `${type} de ${details.stock} unidades. | SKU: ${details.sku} | ${details.productName} (#${details.productId})`;
            
            case 'PRODUCT_CREATE':
                return `Cadastrou o produto: "${details.name}"`;
                
            case 'CATEGORY_CREATE':
                return `Criou a categoria: "${details.name}"`;

            case 'ROLE_CREATE':
                return `Definiu o novo cargo: "${details.name}"`;

            case 'STORE_CREATE':
                return `Inaugurou a unidade: "${details.name}" em ${details.city}`;

            case 'PRODUCT_UPDATE':
                return `Editou informações do produto: "${details.name}"`;

            default:
                if (action.includes('UPDATE')) {
                    return `Atualizou dados de "${details.name || 'Registro #' + (details.id || '')}"`;
                }
                if (action.includes('_LIST') || action.includes('_GET')) {
                    const resource = action.split('_')[0].toLowerCase();
                    return `Consultou a listagem de ${resource}`;
                }
                if (action.includes('_LOGIN')) {
                    return `Realizou login na plataforma`
                }
                return "Realizou uma alteração nas configurações";
        }
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
            'STORE_CREATE': 'Criação da Loja',
            'STORE_USER_LOGIN': 'Login de Usuário',
            'STORE_USER_CREATE': 'Criação de Usuário',
            'ROLE_CREATE': 'Criação de Cargo',
            'ROLE_UPDATE': 'Atualização de Cargo',
            'CREATE_STORE_USER': 'Criação de Usuário da Loja',
            'UPDATE_STORE_USER': 'Atualização de Usuário da Loja',
            'CATEGORY_CREATE': 'Criação de Categoria',
            'CATEGORY_UPDATE': 'Atualização de Categoria',
            'PRODUCT_CREATE': 'Criação de Produto',
            'PRODUCT_UPDATE': 'Atualização de Produto',
            'STOCK_MOVIMENT_LIST': 'Listagem de Movimentações',
            'STOCK_MOVIMENT_CREATE': 'Movimentação de Estoque',
            'STOCK_TRANSFER': 'Transferência de Estoque',
            'STOCK_REVERT': 'Reversão de Estoque',
        };
    
        return actionTranslations[action] || action;
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