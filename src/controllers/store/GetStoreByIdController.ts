import { Request, Response, NextFunction } from "express";
import { GetStoreByIdService } from "../../services/store/GetStoreByIdService";

class GetStoreByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user.id;
            const storeId = req.params.storeId;

            const service = new GetStoreByIdService();
            const store = await service.execute({ 
                userId: userId, 
                storeId: parseInt(storeId, 10) 
            });

            return res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    }
}

export { GetStoreByIdController };