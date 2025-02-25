import { Router, Request, Response, NextFunction } from "express";

// USER CONTROLLERS
import { CreateUserController } from "./controllers/user/CreateUserController"
import { AuthUserController } from "./controllers/user/AuthUserController"
import { DetailUserController } from "./controllers/user/DetailUserController"

// CATEGORY CONTROLLERS
import { CreateCategoryController } from "./controllers/category/CreateCategoryController";
import { ListCategoryController } from "./controllers/category/ListCategoryController";

// PRODUCT CONTROLLERS
import { CreateProductController } from "./controllers/products/CreateProductController";
import { ListProductController } from "./controllers/products/ListProductController";

// STOCK CONTROLLERS
import { CreateStockController } from "./controllers/stock/CreateStockController";


import { authenticated } from "./middlewares/authenticated"
import { ListMovimentStockController } from "./controllers/stock/ListMovimentStockController";

const router = Router();

// USER ROUTES
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

// CATEGORY ROUTES
router.post("/category", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const createCategoryController = new CreateCategoryController();
    await createCategoryController.handle(req, res);
})

router.get("/category", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const listCategoryController = new ListCategoryController();
    await listCategoryController.handle(req, res);
})

// PRODUCT ROUTES
router.post("/product", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const createProductController = new CreateProductController();
    await createProductController.handle(req, res);
})

router.get("/product", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const listProductController = new ListProductController();
    await listProductController.handle(req, res);
})

// STOCK ROUTES
router.post("/stock", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const createStockController = new CreateStockController();
    await createStockController.handle(req, res);
})

router.get("/stockMoviment", (req, res, next) => {authenticated(req, res, next)}, async (req: Request, res: Response): Promise<void> => {
    const listMovimentStockController = new ListMovimentStockController();
    await listMovimentStockController.handle(req, res);
})

export { router };