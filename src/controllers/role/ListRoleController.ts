import { Request, Response } from "express";
import { ListRoleService } from "../../services/role/ListRoleService";

class ListRoleController {
    async handle(req: Request, res: Response) {
        try {
            const listRoleService = new ListRoleService();
            const roleList = await listRoleService.execute({
                storeId: req.body.storeId,
            });

            return res.status(200).json(roleList);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { ListRoleController };