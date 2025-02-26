import { Request, Response } from "express";
import { CreateStoreService } from "../../services/store/CreateStoreService";

class CreateStoreController {
    async handle(req: Request, res: Response) {
        const createStoreService = new CreateStoreService();

        const store = await createStoreService.execute(req.body);
        
        return res.json(store);
    }
}

export { CreateStoreController };