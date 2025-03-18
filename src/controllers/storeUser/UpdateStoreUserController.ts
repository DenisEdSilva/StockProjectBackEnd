import { Request, Response, NextFunction } from "express";
import { UpdateStoreUserService } from "../../services/storeUser/UpdateStoreUserService";

class UpdateStoreUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password, roleId } = req.body;
            const { storeId, storeUserId } = req.params;
            const updatedBy = req.userId;
    
            const service = new UpdateStoreUserService();
            const result = await service.execute({
                performedByUserId: updatedBy,
                id: Number(storeUserId),
                storeId: Number(storeId),
                name,
                email,
                password,
                roleId: roleId ? Number(roleId) : undefined,
                updatedBy: Number(updatedBy),
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"]
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { UpdateStoreUserController };