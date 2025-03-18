import { Request, Response, NextFunction } from "express";
import { DeleteRoleService } from "../../services/role/DeleteRoleService";

class DeleteRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeid ,roleId } = req.params;
            const performedByUserId = req.userId;
    
            const deleteRoleService = new DeleteRoleService();
            const result = await deleteRoleService.execute({ 
                performedByUserId,
                storeId: parseInt(storeid, 10),
                roleId: parseInt(roleId, 10),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string

            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteRoleController };