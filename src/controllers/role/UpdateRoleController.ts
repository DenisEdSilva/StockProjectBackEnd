import { Request, Response, NextFunction } from "express";
import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, roleId } = req.params;
            const performedByUserId = req.userId;
            const { name, permissionIds } = req.body;
    
            const updateRoleService = new UpdateRoleService();
            const role = await updateRoleService.execute({ 
                performedByUserId,
                storeId: parseInt(storeId, 10),
                roleId: parseInt(roleId, 10),
                name, 
                permissionIds,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(role);
        } catch (error) {
            next(error);   
        }
    }
}

export { UpdateRoleController };