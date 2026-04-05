import { Request, Response, NextFunction } from "express";
import { DeleteStoreService } from "../../services/store/DeleteStoreService";

class DeleteStoreController {
    constructor(private deleteStoreService: DeleteStoreService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.deleteStoreService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(req.params.storeId),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteStoreController };