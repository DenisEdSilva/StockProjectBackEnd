import { Request, Response } from "express";
import { CreateStoreService } from "../../services/store/CreateStoreService";

class CreateStoreController {
    async handle(req: Request, res: Response) {
        try {
            const createStoreService = new CreateStoreService();
            const store = await createStoreService.execute(req.body);

            return res.status(201).json(store);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateStoreController };