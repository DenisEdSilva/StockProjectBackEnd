import { Request, Response, NextFunction } from "express";
import { RevertDeleteStoreService } from "../../services/store/RevertDeleteStoreService";

class RevertDeleteStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const { id: storeId } = req.params;
        const userId = req.userId;

        const revertService = new RevertDeleteStoreService();
        const result = await revertService.execute({
            storeId: parseInt(storeId, 10),
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(result);
    }
}

export { RevertDeleteStoreController };