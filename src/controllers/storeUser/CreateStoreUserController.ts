import { Request, Response, NextFunction } from "express";
import { CreateStoreUserService } from "../../services/storeUser/CreateStoreUserService";

class CreateStoreUserController {
    constructor(private createStoreUserService: CreateStoreUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password, roleId } = req.body;
            const { storeId } = req.params;

            const storeUser = await this.createStoreUserService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                name,
                email,
                password,
                roleId: Number(roleId),
                storeId: Number(storeId),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(201).json(storeUser);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStoreUserController };