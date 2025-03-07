import { Request, Response } from "express";
import { UpdateCategoryService } from "../../services/category/UpdateCategoryService";

class UpdateCategoryController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const updateCategoryService = new UpdateCategoryService();
            const updatedCategory = await updateCategoryService.execute({
                id: parseInt(id, 10),
                name
            });

            return res.status(200).json(updatedCategory);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { UpdateCategoryController };