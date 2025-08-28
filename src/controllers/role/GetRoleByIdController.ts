import { Request, Response, NextFunction } from "express";
import { GetRoleByIdService } from "../../services/role/GetRoleByIdService";

class GetRoleByIdController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId, roleId } = req.params;

            const service = new GetRoleByIdService();
            const role = await service.execute({ 
                id: parseInt(req.params.roleId, 10), 
                storeId: parseInt(storeId, 10) 
            });

            return res.status(200).json(role);
        } catch (error) {
            next(error);   
        }
    }
}

export { GetRoleByIdController };