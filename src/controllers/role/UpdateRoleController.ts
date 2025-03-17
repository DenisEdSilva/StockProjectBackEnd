import { Request, Response, NextFunction } from "express";
import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const roleId = parseInt(req.params.roleId, 10);
            const performedByUserId = req.userId;

            const { name, permissionIds } = req.body;
            console.log(roleId ,name, permissionIds);
    
            const updateRoleService = new UpdateRoleService();
            const role = await updateRoleService.execute({ 
                performedByUserId,
                roleId: roleId, 
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