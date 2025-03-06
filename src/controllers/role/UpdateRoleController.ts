import { Request, Response } from "express";

import { UpdateRoleService } from "../../services/role/UpdateRoleService";

class UpdateRoleController {
    async handle(req: Request, res: Response) {
        const { roleId, name, storeId, permissionIds } = req.body

        const updateRoleService = new UpdateRoleService()

        const role = await updateRoleService.execute({ roleId, name, storeId, permissionIds})

        return res.json(role)
    }
}

export { UpdateRoleController };