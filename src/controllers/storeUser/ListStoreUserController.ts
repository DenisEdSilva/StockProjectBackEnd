import { Request, Response, NextFunction } from "express";
import { ListStoreUserService } from "../../services/storeUser/ListStoreUserService";

class ListStoreUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user.id;
    
            const service = new ListStoreUserService();
            const result = await service.execute(userId);
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListStoreUserController };