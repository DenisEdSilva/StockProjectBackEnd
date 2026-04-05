import { Request, Response, NextFunction } from "express";
import { ListStoreUserService } from "../../services/storeUser/ListStoreUserService";

class ListStoreUserController {
    constructor(private listStoreUserService: ListStoreUserService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { page, pageSize, search } = req.query;

            const result = await this.listStoreUserService.execute({
                storeId: Number(storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                page: page ? Number(page) : 1,
                pageSize: pageSize ? Number(pageSize) : 10,
                search: search as string
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListStoreUserController };