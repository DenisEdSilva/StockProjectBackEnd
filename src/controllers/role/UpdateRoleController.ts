import { Request, Response } from "express";
import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    async handle(req: Request, res: Response) {
        try {
            const { roleId, name, storeId, permissionIds } = req.body;

            const updateRoleService = new UpdateRoleService();

            const role = await updateRoleService.execute({ roleId, name, storeId, permissionIds });

            return res.json(role);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { UpdateRoleController };