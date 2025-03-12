import { Request, Response } from "express";
import { DeleteRoleService } from "../../services/role/DeleteRoleService";

class DeleteRoleController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { userId, ipAddress, userAgent } = req.body;

            const deleteRoleService = new DeleteRoleService();
            const result = await deleteRoleService.execute({
                id: parseInt(id, 10),
                userId: userId,
                ipAddress: ipAddress,
                userAgent: userAgent,
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { DeleteRoleController };