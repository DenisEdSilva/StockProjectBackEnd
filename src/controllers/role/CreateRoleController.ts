import { Request, Response } from "express";
import { CreateRoleService } from "../../services/role/CreateRoleService";

class CreateRoleController {
    async handle(req: Request, res: Response) {
        try {
            const { name, storeId, permissionIds } = req.body;

            const createRoleService = new CreateRoleService();

            const role = await createRoleService.execute({ name, storeId, permissionIds });

            return res.json(role);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateRoleController };