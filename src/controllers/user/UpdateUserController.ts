import { Request, Response } from "express";
import { UpdateUserService } from "../../services/user/UpdateUserService";

class UpdateUserController {
    async handle(req: Request, res: Response) {
        try {
            const updateUserService = new UpdateUserService();
            const user = await updateUserService.execute(req.body);

            return res.status(200).json(user);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

export { UpdateUserController };