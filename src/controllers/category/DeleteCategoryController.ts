import { Request, Response, NextFunction } from "express";
import { DeleteCategoryService } from "../../services/category/DeleteCategoryService";

class DeleteCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id, 10);
            const userId = req.userId;
    
            const service = new DeleteCategoryService();
            const result = await service.execute({
                id,
                userId,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"] as string
            });
    
            return res.status(200).json(result);
        } catch (error) {
            next(error);    
        }
    }
}

export { DeleteCategoryController };