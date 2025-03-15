import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../../services/audit/AuditLogService";

class AuditLogController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate, userId, action, page, limit } = req.query;
            const requestUserId = req.userId;
    
            const service = new AuditLogService();
            const result = await service.execute({
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
                userId: userId ? parseInt(userId as string, 10) : undefined,
                action: action as string,
                page: page ? parseInt(page as string, 10) : undefined,
                limit: limit ? parseInt(limit as string, 10) : undefined
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { AuditLogController };