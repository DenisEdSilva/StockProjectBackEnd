import { Request, Response } from "express";
import { CreateCategoryService } from "../../services/category/CreateCategoryService";

class CreateCategoryController {
    async handle(req: Request, res: Response) {
        try {
            const { name, storeId } = req.body;

            const createCategoryService = new CreateCategoryService();

            const category = await createCategoryService.execute({ name, storeId });

            return res.json(category);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateCategoryController };