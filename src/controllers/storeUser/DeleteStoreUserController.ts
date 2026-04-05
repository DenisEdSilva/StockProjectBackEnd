import { Request, Response, NextFunction } from "express";
import { DeleteStoreUserService } from "../../services/storeUser/DeleteStoreUserService";

class DeleteStoreUserController {
    constructor(private deleteStoreUserService: DeleteStoreUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, storeUserId } = req.params;

            const result = await this.deleteStoreUserService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(storeId),
                storeUserId: Number(storeUserId),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteStoreUserController };