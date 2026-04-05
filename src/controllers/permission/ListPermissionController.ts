import { Request, Response, NextFunction } from "express";
import { ListPermissionService } from "../../services/permission/ListPermissionService";

class ListPermissionController {
    constructor(private listPermissionService: ListPermissionService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.listPermissionService.execute();

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListPermissionController };