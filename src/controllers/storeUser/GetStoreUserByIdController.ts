import { Request, Response, NextFunction } from "express";
import { GetStoreUserByIdService } from "../../services/storeUser/GetStoreUserByIdService";

class GetStoreUserByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const storeId = parseInt(req.params.storeId, 10);
        const storeUserId = parseInt(req.params.storeUserId, 10);

        const getStoreUserByIdService = new GetStoreUserByIdService();
        try {
            const storeUser = await getStoreUserByIdService.execute({
                storeId,
                storeUserId
            });
            return res.json(storeUser);
        } catch (error) {
            next(error);
        }
    }
}

export { GetStoreUserByIdController };