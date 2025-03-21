import { Request, Response, NextFunction } from "express";
import { UpdateStoreService } from "../../services/store/UpdateStoreService";

class UpdateStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { name, city, state, zipCode } = req.body;
            const userId = req.user.id;
            const performedByUserId = req.user.id;
    
            const updateStoreService = new UpdateStoreService();
            const result = await updateStoreService.execute({
                storeId: parseInt(storeId, 10),
                performedByUserId,
                name,
                city,
                state,
                zipCode,
                userId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateStoreController };