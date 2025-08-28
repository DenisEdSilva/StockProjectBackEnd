import { Request, Response, NextFunction } from "express";
import { ListRoleService } from "../../services/role/ListRoleService";

class ListRoleController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeId } = req.params;
            const {
                page = 1,
                pageSize = 10,
                search,
            } = req.query;

            const listRoleService = new ListRoleService();
            const result = await listRoleService.execute({ 
                storeId: parseInt(storeId, 10),
                search: search as string,
                page: Number(page),
                pageSize: Number(pageSize),
             });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { ListRoleController };