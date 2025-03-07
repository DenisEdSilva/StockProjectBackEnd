import { Request, Response } from "express";
import { DeleteProductService } from "../../services/products/DeleteProductService";

class DeleteProductController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params; // Obtém o ID do produto a ser deletado

            // Converte o ID para número (já que vem como string da requisição)
            const productId = parseInt(id, 10);

            if (isNaN(productId)) {
                throw new Error("Invalid product ID");
            }

            const deleteProductService = new DeleteProductService();
            const result = await deleteProductService.execute({ id: productId });

            return res.status(200).json(result); // Retorna sucesso
        } catch (error) {
            return res.status(400).json({
                error: error.message
            });
        }
    }
}

export { DeleteProductController };