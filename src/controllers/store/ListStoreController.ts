import { Request, Response } from "express";
import { ListStoreService } from "../../services/store/ListStoreService";

class ListStoreController {
    async handle(req: Request, res: Response) {
        const listStoreService = new ListStoreService();

        const stores = await listStoreService.execute(req.body);

        return res.json(stores);
    }
}

export { ListStoreController };