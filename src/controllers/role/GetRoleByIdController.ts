import { Request, Response, NextFunction } from "express";
import { GetRoleByIdService } from "../../services/role/GetRoleByIdService";

class GetRoleByIdController {
    constructor(private getRoleByIdService: GetRoleByIdService) {}

    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, roleId } = req.params;

            const role = await this.getRoleByIdService.execute({
                id: Number(roleId),
                storeId: Number(storeId),
                performedByUserId: req.user.id,
                userType: req.user.type,
                tokenStoreId: req.user.storeId
            });

            return res.status(200).json(role);
        } catch (error) {
            next(error);
        }
    }
}

export { GetRoleByIdController };