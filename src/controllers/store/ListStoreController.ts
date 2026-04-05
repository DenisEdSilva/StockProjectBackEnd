import { Request, Response, NextFunction } from "express";
import { ListStoreService } from "../../services/store/ListStoreService";

class ListStoreController {
    constructor(private listStoreService: ListStoreService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.listStoreService.execute({ 
                userId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListStoreController };