import { Request, Response, NextFunction } from "express";
import { GetStoreUserByIdService } from "../../services/storeUser/GetStoreUserByIdService";

class GetStoreUserByIdController {
    constructor(private getStoreUserByIdService: GetStoreUserByIdService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, storeUserId } = req.params;

            const storeUser = await this.getStoreUserByIdService.execute({
                storeId: Number(storeId),
                storeUserId: Number(storeUserId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId
            });

            return res.status(200).json(storeUser);
        } catch (error) {
            next(error);
        }
    }
}

export { GetStoreUserByIdController };