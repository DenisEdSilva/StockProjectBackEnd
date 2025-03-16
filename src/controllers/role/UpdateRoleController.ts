import { Request, Response, NextFunction } from "express";
import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const roleId = parseInt(req.params.roleId, 10);

            const { name, permissionIds } = req.body;
            console.log(roleId ,name, permissionIds);
    
            const updateRoleService = new UpdateRoleService();
            const role = await updateRoleService.execute({ 
                roleId: roleId, 
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