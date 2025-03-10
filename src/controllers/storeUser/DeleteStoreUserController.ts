import { Request, Response } from "express";
import { DeleteStoreUserService } from "../../services/storeUser/DeleteStoreUserService";

class DeleteStoreUserController {
    async handle(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const deleteStoreUserService = new DeleteStoreUserService();
            const result = await deleteStoreUserService.execute({
                id: parseInt(id, 10)
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { DeleteStoreUserController };