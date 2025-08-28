import { Request, Response, NextFunction } from "express";
import { ListPermissionService } from "../../services/permission/ListPermissionService";

class ListPermissionController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const service = new ListPermissionService();
            const result = await service.execute();
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListPermissionController };