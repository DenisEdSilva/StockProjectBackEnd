import { Request, Response } from "express";
import { ListStoreUserService } from "../../services/storeUser/ListStoreUserService";

class ListStoreUserController {
    async handle(req: Request, res: Response) {
        try {
            const listStoreUserService = new ListStoreUserService();
            const storeUserList = await listStoreUserService.execute({
                storeId: req.body.storeId
            });

            return res.status(200).json(storeUserList);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { ListStoreUserController };