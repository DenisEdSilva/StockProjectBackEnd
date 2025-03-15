import { Request, Response, NextFunction } from "express";
import { DeleteProductService } from "../../services/products/DeleteProductService";

class DeleteProductController {
    async handle(req: Request, res: Response, next: NextFunction) {
        const id = parseInt(req.params.id, 10);
        const userId = req.userId;

        const service = new DeleteProductService();
        const result = await service.execute({
            id,
            userId,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] as string
        });

        return res.status(200).json(result);
    }
}

export { DeleteProductController };