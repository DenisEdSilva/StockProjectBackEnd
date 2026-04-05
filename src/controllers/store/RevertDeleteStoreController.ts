import { Request, Response, NextFunction } from "express";
import { RevertDeleteStoreService } from "../../services/store/RevertDeleteStoreService";

class RevertDeleteStoreController {
    constructor(private revertDeleteStoreService: RevertDeleteStoreService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.revertDeleteStoreService.execute({
                storeId: Number(req.params.storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { RevertDeleteStoreController };