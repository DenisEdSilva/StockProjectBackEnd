import { Request, Response, NextFunction } from "express";
import { ListStoreService } from "../../services/store/ListStoreService";

class ListStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const ownerId = req.userId;

        const listStoreService = new ListStoreService();
        const stores = await listStoreService.execute({ ownerId });

        return res.status(200).json(stores);
    }
}

export { ListStoreController };