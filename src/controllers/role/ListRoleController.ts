import { Request, Response, NextFunction } from "express";
import { ListRoleService } from "../../services/role/ListRoleService";

class ListRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const storeId = parseInt(req.params.storeId, 10);

        const listRoleService = new ListRoleService();
        const roles = await listRoleService.execute({ storeId });

        return res.status(200).json(roles);
    }
}

export { ListRoleController };