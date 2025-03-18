import { Request, Response, NextFunction } from "express";
import { DeleteStoreService } from "../../services/store/DeleteStoreService";

class DeleteStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const performedByUserId = req.userId;
    
            const deleteStoreService = new DeleteStoreService();
            const result = await deleteStoreService.execute({
                performedByUserId,
                storeId: parseInt(storeId, 10),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteStoreController };