import prismaClient from "../../prisma";
import { ValidationError, NotFoundError } from "../../errors";

interface AuditLogRequest {
    requestUserId: number;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    action?: string;
    page?: number;
    limit?: number;
}

class AuditLogService {
    async execute(filters: AuditLogRequest) {
        return await prismaClient.$transaction(async (tx) => {

            if (filters.requestUserId !== 1) {
                throw new ValidationError("Usuário não autorizado");
            }

            this.validateDates(filters.startDate, filters.endDate);
            const page = filters.page || 1;
            const limit = filters.limit || 25;
            this.validatePagination(page, limit);


            const where = {
                createdAt: {
                    gte: filters.startDate,
                    lte: filters.endDate
                },
                userId: filters.userId,
                action: filters.action
            };

            const [logs, total] = await Promise.all([
                tx.auditLog.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: "desc" }
                }),
                tx.auditLog.count({ where })
            ]);

            if (logs.length === 0) {
                throw new NotFoundError("Nenhum registro encontrado");
            }

            await tx.auditLog.create({
                data: {
                    action: "AUDIT_LOG_ACCESS",
                    details: `Consulta de logs com filtros: ${JSON.stringify(filters)}`,
                    userId: filters.userId
                }
            });

            return {
                data: logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        });
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