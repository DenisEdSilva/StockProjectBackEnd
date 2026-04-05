import { Request, Response, NextFunction } from "express";
import { ListRoleService } from "../../services/role/ListRoleService";

class ListRoleController {
    constructor(private listRoleService: ListRoleService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const { page, pageSize, search } = req.query;

            const result = await this.listRoleService.execute({
                storeId: Number(storeId),
                userId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                search: search as string,
                page: page ? Number(page) : 1,
                pageSize: pageSize ? Number(pageSize) : 10
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListRoleController };