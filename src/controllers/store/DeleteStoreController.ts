import { Request, Response, NextFunction } from "express";
import { DeleteStoreService } from "../../services/store/DeleteStoreService";

class DeleteStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const { id: storeId } = req.params;
        const ownerId = req.userId;

        const deleteStoreService = new DeleteStoreService();
        const result = await deleteStoreService.execute({
            storeId: parseInt(storeId, 10),
            ownerId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(result);
    }
}

export { DeleteStoreController };