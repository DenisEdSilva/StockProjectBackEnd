import { Request, Response } from "express";
import { UpdateStoreUserService } from "../../services/storeUser/UpdateStoreUserService";

class UpdateStoreUserController {
    async handle(req: Request, res: Response) {
        const updateStoreUserService = new UpdateStoreUserService();

        const storeUser = await updateStoreUserService.execute(req.body);

        return res.json(storeUser);
    }
}

export { UpdateStoreUserController }