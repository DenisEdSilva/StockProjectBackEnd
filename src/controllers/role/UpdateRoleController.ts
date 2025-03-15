import { Request, Response, NextFunction } from "express";
import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: roleId } = req.params;
            const { name, permissionIds } = req.body;
    
            const updateRoleService = new UpdateRoleService();
            const role = await updateRoleService.execute({ 
                roleId: parseInt(roleId, 10), 
                name, 
                permissionIds 
            });
    
            return res.status(200).json(role);
        } catch (error) {
            next(error);   
        }
    }
}

export { UpdateRoleController };