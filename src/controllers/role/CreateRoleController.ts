import { Request, Response, NextFunction } from "express";
import { CreateRoleService } from "../../services/role/CreateRoleService";

class CreateRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, permissionIds } = req.body;
            const storeId = parseInt(req.params.storeId, 10);
            const performedByUserId = req.user.id;
            
            const createRoleService = new CreateRoleService();
            const role = await createRoleService.execute({ 
                performedByUserId,
                name, 
                storeId, 
                permissionIds,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
             });
            
            return res.status(201).json(role);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateRoleController };