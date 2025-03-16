import { Request, Response, NextFunction } from "express";
import { CreateStoreUserService } from "../../services/storeUser/CreateStoreUserService";

class CreateStoreUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, name, email, password, roleId } = req.body;
            const storeId = parseInt(req.params.storeId, 10);
            console.log(storeId)

            const createStoreUserService = new CreateStoreUserService();
            const storeUser = await createStoreUserService.execute({
                name,
                email,
                password,
                roleId,
                storeId,
                createdBy: userId
            });

            return res.status(201).json(storeUser);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStoreUserController };