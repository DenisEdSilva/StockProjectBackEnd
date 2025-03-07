import { Request, Response } from "express";
import { UpdateStoreUserService } from "../../services/storeUser/UpdateStoreUserService";

class UpdateStoreUserController {
    async handle(req: Request, res: Response) {
        try {
            const updateStoreUserService = new UpdateStoreUserService();
            const storeUser = await updateStoreUserService.execute(req.body);

            return res.status(200).json(storeUser);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { UpdateStoreUserController };