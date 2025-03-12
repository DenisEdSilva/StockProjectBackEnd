import { Request, Response } from "express";
import { DeleteProductService } from "../../services/products/DeleteProductService";

class DeleteProductController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { userId, ipAddress, userAgent } = req.body;

            const deleteProductService = new DeleteProductService();
            const result = await deleteProductService.execute({
                id: parseInt(id, 10),
                userId,
                ipAddress,
                userAgent,
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                error: error.message
            });
        }
    }
}

export { DeleteProductController };