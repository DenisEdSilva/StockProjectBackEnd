import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../../services/audit/AuditLogService";

class AuditLogController {
    constructor(private auditLogService: AuditLogService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { startDate, endDate, userId, storeUserId, action, page, limit } = req.query;

            const result = await this.auditLogService.execute(Number(storeId), {
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                userId: userId ? Number(userId) : undefined,
                storeUserId: storeUserId ? Number(storeUserId) : undefined,
                action: action as string,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 25
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { AuditLogController };