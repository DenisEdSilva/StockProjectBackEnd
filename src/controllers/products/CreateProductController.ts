import { Request, Response } from "express";
import { CreateProductService } from "../../services/products/CreateProductService";
import { updateStoreActivity, updateUserActivity } from "../../utils/activityTracker";

class CreateProductController {
    async handle(req: Request, res: Response) {
        try {
            const { banner, name, stock, price, description, categoryId, storeId } = req.body;
            const userId = req.userId

            const createProductService = new CreateProductService();

            const product = await createProductService.execute({
                banner,
                name,
                stock,
                price,
                description,
                categoryId,
                storeId,
            });

            await updateUserActivity(userId)
            await updateStoreActivity(storeId)

            return res.json(product);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { CreateProductController };