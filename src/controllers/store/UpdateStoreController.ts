import { Request, Response, NextFunction } from "express";
import { UpdateStoreService } from "../../services/store/UpdateStoreService";

class UpdateStoreController {
    constructor(private updateStoreService: UpdateStoreService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, city, state, zipCode } = req.body;

            const result = await this.updateStoreService.execute({
                storeId: Number(req.params.storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                name,
                city,
                state,
                zipCode,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateStoreController };