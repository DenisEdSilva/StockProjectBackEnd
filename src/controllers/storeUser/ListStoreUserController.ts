import { Request, Response } from "express";
import { ListStoreUserService } from "../../services/storeUser/ListStoreUserService";

class ListStoreUserController {
    async handle(req: Request, res: Response) {
        const storeId = parseInt(req.params.storeId, 10);
        const userId = req.userId;

        const service = new ListStoreUserService();
        const result = await service.execute(userId);

        return res.status(200).json(result);
    }
}

export { ListStoreUserController };