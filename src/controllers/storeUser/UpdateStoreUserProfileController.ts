import { Request, Response, NextFunction } from "express";
import { UpdateStoreUserProfileService } from "../../services/storeUser/UpdateStoreUserProfileService";

class UpdateStoreUserProfileController {
    constructor(private updateStoreUserProfileService: UpdateStoreUserProfileService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            const { storeId, storeUserId } = req.params;

            const result = await this.updateStoreUserProfileService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                id: Number(storeUserId),
                storeId: Number(storeId),
                name,
                email,
                password,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateStoreUserProfileController };