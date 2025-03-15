import { Request, Response, NextFunction } from "express";
import { CreateStoreService } from "../../services/store/CreateStoreService";

class CreateStoreController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, city, state, zipCode } = req.body;
            const ownerId = req.userId;
    
            const createStoreService = new CreateStoreService();
            const store = await createStoreService.execute({
                name,
                city,
                state,
                zipCode,
                ownerId
            });
    
            return res.status(201).json(store);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateStoreController };