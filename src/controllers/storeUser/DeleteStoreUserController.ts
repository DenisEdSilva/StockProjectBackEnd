import { Request, Response, NextFunction } from "express";
import { DeleteStoreUserService } from "../../services/storeUser/DeleteStoreUserService";

class DeleteStoreUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, storeUserId } = req.params;
            const performedByUserId = req.userId;
    
            const service = new DeleteStoreUserService();
            const result = await service.execute({
                performedByUserId,
                storeId: parseInt(storeId, 10),
                storeUserId: parseInt(storeUserId, 10),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteStoreUserController };