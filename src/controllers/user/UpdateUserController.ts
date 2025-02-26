import { Request, Response } from "express";
import { UpdateUserService } from "../../services/user/UpdateUserService";

class UpdateUserController {
    async handle(req: Request, res: Response) {
        const updateUserService = new UpdateUserService();

        const user = await updateUserService.execute(req.body);

        return res.json(user);
    }
}

export { UpdateUserController }