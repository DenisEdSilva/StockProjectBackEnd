import { Request, Response } from "express";
import { ListStoreService } from "../../services/store/ListStoreService";

class ListStoreController {
    async handle(req: Request, res: Response) {
        try {
            const listStoreService = new ListStoreService();
            const stores = await listStoreService.execute(req.body);

            return res.status(200).json(stores); 
        } catch (error) {
            return res.status(400).json({ error: error.message }); 
        }
    }
}

export { ListStoreController };