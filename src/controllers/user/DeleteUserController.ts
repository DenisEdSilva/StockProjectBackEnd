import { Request, Response, NextFunction } from "express";
import { DeleteUserService } from "../../services/user/DeleteUserService";

class DeleteUserController {
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const parsedId = parseInt(id, 10);

            const deleteUserService = new DeleteUserService();
            const result = await deleteUserService.execute({ id: parsedId });
            
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

export { DeleteUserController };