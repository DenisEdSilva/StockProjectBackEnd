import { Request, Response, NextFunction } from "express";
import { UpdateStoreUserService } from "../../services/storeUser/UpdateStoreUserService";

class UpdateStoreUserController {
    constructor(private updateStoreUserService: UpdateStoreUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password, roleId } = req.body;
            const { storeId, storeUserId } = req.params;

            const result = await this.updateStoreUserService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                id: Number(storeUserId),
                storeId: Number(storeId),
                name,
                email,
                password,
                roleId: roleId ? Number(roleId) : undefined,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateStoreUserController };