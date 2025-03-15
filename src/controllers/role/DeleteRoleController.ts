import { Request, Response, NextFunction } from "express";
import { DeleteRoleService } from "../../services/role/DeleteRoleService";

class DeleteRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { id: roleId } = req.params;
            const userId = req.userId;
    
            const deleteRoleService = new DeleteRoleService();
            const result = await deleteRoleService.execute({ 
                roleId: parseInt(roleId, 10), 
                userId 
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteRoleController };