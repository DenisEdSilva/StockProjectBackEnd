import { Router, Request, Response, NextFunction } from "express";

import { CreateUserController } from "./controllers/user/CreateUserController"
import { AuthUserController } from "./controllers/user/AuthUserController"
import { DetailUserController } from "./controllers/user/DetailUserController"

import { authenticated } from "./middlewares/authenticated"

const router = Router();

router.post("/users", async (req: Request, res: Response): Promise<void> => {
    const createUserController = new CreateUserController();
    await createUserController.handle(req, res);
});

router.post("/session", async (req: Request, res: Response): Promise<void> => {
    const authUserController = new AuthUserController();
    await authUserController.handle(req, res);
})

router.get("/me", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const detailUserController = new DetailUserController();
    await detailUserController.handle(req, res);
})

export { router };