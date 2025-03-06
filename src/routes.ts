import { Router, Request, Response, NextFunction } from "express";

interface RequestWithToken extends Request {
    userId: number;
    token: string;
}

// PERMISSION CONTROLLERS
import { CreatePermissionController } from "./controllers/permission/CreatePermissionController";

// USER CONTROLLERS
import { CreateUserController } from "./controllers/user/CreateUserController"
import { AuthUserController } from "./controllers/user/AuthUserController"
import { DetailUserController } from "./controllers/user/DetailUserController"
import { UpdateUserController } from "./controllers/user/UpdateUserController";

// STORE CONTROLLERS
import { CreateStoreController } from "./controllers/store/CreateStoreController";
import { ListStoreController } from "./controllers/store/ListStoreController";

// ROLE CONTROLLERS
import { CreateRoleController } from "./controllers/role/CreateRoleController";

// STORE USERS CONTROLLERS
import { CreateStoreUserController } from "./controllers/storeUser/CreateStoreUserController";
import { ListStoreUserController } from "./controllers/storeUser/ListStoreUserController";
import { UpdateStoreUserController } from "./controllers/storeUser/UpdateStoreUserController";
import { AuthStoreUserController } from "./controllers/storeUser/AuthStoreUserController";

// CATEGORY CONTROLLERS
import { CreateCategoryController } from "./controllers/category/CreateCategoryController";
import { ListCategoryController } from "./controllers/category/ListCategoryController";

// PRODUCT CONTROLLERS
import { CreateProductController } from "./controllers/products/CreateProductController";
import { ListProductController } from "./controllers/products/ListProductController";

// STOCK CONTROLLERS
import { CreateStockController } from "./controllers/stock/CreateStockController";
import { ListMovimentStockController } from "./controllers/stock/ListMovimentStockController";
import { RevertStockController } from "./controllers/stock/RevertStockController";

// MIDDLEWARES
import { authenticated } from "./middlewares/authenticated"
import { authorized } from "./middlewares/authorized"



const router = Router();

// PERMISSION ROUTES
router.post("/permission", async (req: Request, res: Response): Promise<void> => {
    const createPermissionController = new CreatePermissionController();
    await createPermissionController.handle(req, res);
});

// USER ROUTES
router.post("/users", async (req: Request, res: Response): Promise<void> => {
    const createUserController = new CreateUserController();
    await createUserController.handle(req, res);
});

router.post("/session", async (req: Request, res: Response): Promise<void> => {
    const authUserController = new AuthUserController();
    await authUserController.handle(req, res);
})

router.get("/me", authenticated, async (req: Request, res: Response): Promise<void> => {
    const detailUserController = new DetailUserController();
    await detailUserController.handle(req, res);
})

router.put("/me", authenticated, async (req: Request, res: Response): Promise<void> => {
    const updateUserController = new UpdateUserController();
    await updateUserController.handle(req, res);
})

// STORE ROUTES
router.post("/store", authenticated, async (req: Request, res: Response): Promise<void> => {
    const createStoreController = new CreateStoreController();
    await createStoreController.handle(req, res);
})

router.get("/store", authenticated, async (req: Request, res: Response): Promise<void> => {
    const listStorecontroller = new ListStoreController();
    await listStorecontroller.handle(req, res);
})

// ROLE ROUTES
router.post("/role", authenticated, async (req: Request, res: Response): Promise<void> => {
    const createRoleController = new CreateRoleController();
    await createRoleController.handle(req, res);
  })

// STORE USER ROUTES
router.post("/store/user", authenticated, async (req: Request, res: Response): Promise<void> => {
    const createStoreUserController = new CreateStoreUserController();
    await createStoreUserController.handle(req, res);
})

router.get("/store/user", authenticated, async (req: Request, res: Response): Promise<void> => {
    const listStoreUserController = new ListStoreUserController();
    await listStoreUserController.handle(req, res);
})

router.put("/store/user", authenticated, async (req: Request, res: Response): Promise<void> => {
    const updateStoreUserController = new UpdateStoreUserController();
    await updateStoreUserController.handle(req, res);
})

router.post("/store/session", async (req: Request, res: Response): Promise<void> => {
    const authStoreUserController = new AuthStoreUserController();
    await authStoreUserController.handle(req, res);
})

// CATEGORY ROUTES
router.post("/category", authenticated, authorized("POST", "CATEGORY"), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const createCategoryController = new CreateCategoryController();
    await createCategoryController.handle(req, res);
})

router.get("/category", authenticated, authorized("GET", "CATEGORY"), async (req: Request, res: Response): Promise<void> => {
    const listCategoryController = new ListCategoryController();
    await listCategoryController.handle(req, res);
})

// PRODUCT ROUTES
router.post("/product", authenticated, async (req: Request, res: Response): Promise<void> => {
    const createProductController = new CreateProductController();
    await createProductController.handle(req, res);
})

router.get("/product", authenticated, async (req: Request, res: Response): Promise<void> => {
    const listProductController = new ListProductController();
    await listProductController.handle(req, res);
})

// STOCK ROUTES
router.post("/stock", authenticated, async (req: Request, res: Response): Promise<void> => {
    const createStockController = new CreateStockController();
    await createStockController.handle(req, res);
})

router.get("/stockMoviment", authenticated, async (req: Request, res: Response): Promise<void> => {
    const listMovimentStockController = new ListMovimentStockController();
    await listMovimentStockController.handle(req, res);
})

router.post("/revertMoviment", authenticated, async (req: Request, res: Response): Promise<void> => {
    const revertStockController = new RevertStockController();
    await revertStockController.handle(req, res);
})

export { router };