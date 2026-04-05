import { Request, Response, NextFunction } from "express";
import { CreateRoleService } from "../../services/role/CreateRoleService";

class CreateRoleController {
    constructor(private createRoleService: CreateRoleService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, permissionIds } = req.body;
            const { storeId } = req.params;
            const { id: performedByUserId, type: userType } = req.user;

            const role = await this.createRoleService.execute({
                performedByUserId,
                userType,
                name,
                storeId: Number(storeId),
                permissionIds,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] || ""
            });

            return res.status(201).json(role);
        } catch (error) {
            next(error);
        }
    }
}

export { CreateRoleController };