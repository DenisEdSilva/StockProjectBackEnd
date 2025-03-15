import { Request, Response, NextFunction } from "express";
import { UpdateCategoryService } from "../../services/category/UpdateCategoryService";

class UpdateCategoryController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const id = parseInt(req.params.id, 10);
        const { name } = req.body;
        const userId = req.userId;

        const service = new UpdateCategoryService();
        const updatedCategory = await service.execute({
            id,
            name,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(updatedCategory);
    }
}

export { UpdateCategoryController };