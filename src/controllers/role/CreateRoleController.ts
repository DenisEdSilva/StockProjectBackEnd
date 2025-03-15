import { Request, Response, NextFunction } from "express";
import { CreateRoleService } from "../../services/role/CreateRoleService";

class CreateRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const { name, permissionIds } = req.body;
        const storeId = parseInt(req.params.storeId, 10);
        const userId = req.userId;
        
        const createRoleService = new CreateRoleService();
        const role = await createRoleService.execute({ name, storeId, permissionIds });
        
        return res.status(201).json(role);
    }
}

export { CreateRoleController };