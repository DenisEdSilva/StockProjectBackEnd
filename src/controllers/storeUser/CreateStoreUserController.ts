import { Request, Response, NextFunction } from "express";
import { CreateStoreUserService } from "../../services/storeUser/CreateStoreUserService";

class CreateStoreUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const performedbyUserId = req.userId;
            const { name, email, password, roleId } = req.body;
            const storeId = parseInt(req.params.storeId, 10);

            const createStoreUserService = new CreateStoreUserService();
            const storeUser = await createStoreUserService.execute({
                performedbyUserId,
                name,
                email,
                password,
                roleId,
                storeId,
                createdBy: performedbyUserId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"]
            });

            return res.status(201).json(storeUser);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStoreUserController };