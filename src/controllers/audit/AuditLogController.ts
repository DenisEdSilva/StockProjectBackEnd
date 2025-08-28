import { Request, Response, NextFunction } from "express";
import { AuditLogService } from "../../services/audit/AuditLogService";

class AuditLogController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { startDate, endDate, userId, storeUserId, action, page, limit } = req.query;
            const { storeId } = req.params;
            const requestUserId = req.user.id;
    
            const service = new AuditLogService();
            const result = await service.execute(
                parseInt(storeId as string, 10),
                {
                    requestUserId,
                    startDate: startDate ? new Date(startDate as string) : undefined,
                    endDate: endDate ? new Date(endDate as string) : undefined,
                    userId: userId ? parseInt(userId as string, 10) : undefined,
                    storeUserId: storeUserId ? parseInt(storeUserId as string, 10) : undefined,
                    action: action as string,
                    page: page ? parseInt(page as string, 10) : undefined,
                    limit: limit ? parseInt(limit as string, 10) : undefined
                }
            );

            console.log(result);
    
            return res.status(200).json({
                data: result.data,
                users: result.users || [],
                actions: result.actions || [],
                pagination: {
                    page: result.pagination?.page || 1,
                    pageSize: result.pagination?.limit || 25,
                    total: result.pagination?.total || 0,
                    totalPages: result.pagination?.totalPages || 1
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export { AuditLogController };