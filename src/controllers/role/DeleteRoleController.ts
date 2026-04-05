import { Request, Response, NextFunction } from "express";
import { DeleteRoleService } from "../../services/role/DeleteRoleService";

class DeleteRoleController {
    constructor(private deleteRoleService: DeleteRoleService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, roleId } = req.params;

            const result = await this.deleteRoleService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(storeId),
                roleId: Number(roleId),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteRoleController };