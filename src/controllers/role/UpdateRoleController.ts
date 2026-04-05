import { Request, Response, NextFunction } from "express";
import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    constructor(private updateRoleService: UpdateRoleService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, roleId } = req.params;
            const { name, permissionIds } = req.body;

            const role = await this.updateRoleService.execute({
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId,
                storeId: Number(storeId),
                roleId: Number(roleId),
                name,
                permissionIds,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(200).json(role);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateRoleController };