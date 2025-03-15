import { Request, Response } from "express";
import { UpdateStoreUserService } from "../../services/storeUser/UpdateStoreUserService";

class UpdateStoreUserController {
    async handle(req: Request, res: Response) {
        const { id, storeId, name, email, password, roleId } = req.body;
        const updatedBy = req.userId;

        const service = new UpdateStoreUserService();
        const result = await service.execute({
            id: Number(id),
            storeId: Number(storeId),
            name,
            email,
            password,
            roleId: roleId ? Number(roleId) : undefined,
            updatedBy: Number(updatedBy)
        });

        return res.status(200).json(result);
    }
}

export { UpdateStoreUserController };