import { Request, Response } from "express";
import { CreateStoreUserService } from "../../services/storeUser/CreateStoreUserService";

class CreateStoreUserController {
    async handle(req: Request, res: Response) {
        try {
            const { userId, name, email, password, roleId, storeId } = req.body;

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
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateStoreUserController };