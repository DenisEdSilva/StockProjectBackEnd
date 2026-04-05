import { Request, Response, NextFunction } from "express";
import { CreatePermissionService } from "../../services/permission/CreatePermissionService";

class CreatePermissionController {
    constructor(private createPermissionService: CreatePermissionService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, action, resource } = req.body;
            const result = await this.createPermissionService.execute({ 
                name, 
                action, 
                resource 
            });

            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { CreatePermissionController };