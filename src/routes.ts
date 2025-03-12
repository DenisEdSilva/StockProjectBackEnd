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

import { UpdateRoleController } from "./controllers/role/UpdateRoleController";
import { UpdateProductController } from "./controllers/products/UpdateProductController";
import { DeleteProductController } from "./controllers/products/DeleteProductController";
import { UpdateCategoryController } from "./controllers/category/UpdateCategoryController";
import { DeleteCategoryController } from "./controllers/category/DeleteCategoryController";
import { DeleteStoreUserController } from "./controllers/storeUser/DeleteStoreUserController";
import { ListRoleController } from "./controllers/role/ListRoleController";
import { DeleteRoleController } from "./controllers/role/DeleteRoleController";
import { UpdateStoreController } from "./controllers/store/UpdateStoreController";
import { DeleteStoreController } from "./controllers/store/DeleteStoreController";
import { RevertDeleteStoreController } from "./controllers/store/RevertDeleteStoreController";



const router = Router();

// PERMISSION ROUTES
router.post("/permission", async (req: Request, res: Response): Promise<void> => {
    const createPermissionController = new CreatePermissionController();
    await createPermissionController.handle(req, res);
});

// USER ROUTES

// criando um usuário (owner)
router.post("/users", async (req: Request, res: Response): Promise<void> => {
    const createUserController = new CreateUserController();
    await createUserController.handle(req, res);
});

// autenticando um usuário
router.post("/session", async (req: Request, res: Response): Promise<void> => {
    const authUserController = new AuthUserController();
    await authUserController.handle(req, res);
})

// atualizando um usuário
router.put("/me", authenticated, async (req: Request, res: Response): Promise<void> => {
    const updateUserController = new UpdateUserController();
    await updateUserController.handle(req, res);
})

// detalhando um usuário
router.get("/me", authenticated, async (req: Request, res: Response): Promise<void> => {
    const detailUserController = new DetailUserController();
    await detailUserController.handle(req, res);
})

// STORE ROUTES

// criando uma loja
router.post("/store", authenticated, authorized("POST", "STORE"), async (req: Request, res: Response): Promise<void> => {
    const createStoreController = new CreateStoreController();
    await createStoreController.handle(req, res);
})

// listando as lojas
router.get("/store", authenticated, authorized("GET", "STORE"), async (req: Request, res: Response): Promise<void> => {
    const listStorecontroller = new ListStoreController();
    await listStorecontroller.handle(req, res);
})

// atualizando uma loja
router.put("/store", authenticated, authorized("PUT", "STORE"), async (req: Request, res: Response): Promise<void> => {
    const updateStoreController = new UpdateStoreController();
    await updateStoreController.handle(req, res);
})

// deletando uma loja
router.delete("/store", authenticated, authorized("DELETE", "STORE"), async (req: Request, res: Response): Promise<void> => {
    const deleteStoreController = new DeleteStoreController();
    await deleteStoreController.handle(req, res);
})

// reverte a loja deletada
router.post("/store/revert", authenticated, authorized("POST", "STORE"), async (req: Request, res: Response): Promise<void> => {
    const revertStoreController = new RevertDeleteStoreController();
    await revertStoreController.handle(req, res);
})

// ROLE ROUTES

// criando uma role
router.post("/role", authenticated, authorized("POST", "ROLE"), async (req: Request, res: Response): Promise<void> => {
    const createRoleController = new CreateRoleController();
    await createRoleController.handle(req, res);
})

// atualizando uma role
router.put("/role", authenticated, authorized("PUT", "ROLE"), async (req: Request, res: Response): Promise<void> => {
    const updateRoleController = new UpdateRoleController();
    await updateRoleController.handle(req, res);
})

// listando as roles
router.get("/role", authenticated, authorized("GET", "ROLE"), async (req: Request, res: Response): Promise<void> => {
    const listRoleController = new ListRoleController();
    await listRoleController.handle(req, res);
})

// deletando uma role
router.delete("/role", authenticated, authorized("DELETE", "ROLE"), async (req: Request, res: Response): Promise<void> => {
    const deleteRoleController = new DeleteRoleController();
    await deleteRoleController.handle(req, res);
})


// STORE USER ROUTES

// criando um usuário
router.post("/store/user", authenticated, authorized("POST", "STORE_USER"), async (req: Request, res: Response): Promise<void> => {
    const createStoreUserController = new CreateStoreUserController();
    await createStoreUserController.handle(req, res);
})

// autenticando um usuário
router.post("/store/session", async (req: Request, res: Response): Promise<void> => {
    const authStoreUserController = new AuthStoreUserController();
    await authStoreUserController.handle(req, res);
})

// atualizando um usuário
router.put("/store/user", authenticated, authorized("PUT", "STORE_USER"), async (req: Request, res: Response): Promise<void> => {
    const updateStoreUserController = new UpdateStoreUserController();
    await updateStoreUserController.handle(req, res);
})

// listando usuários
router.get("/store/user", authenticated, authorized("GET", "STORE_USER"), async (req: Request, res: Response): Promise<void> => {
    const listStoreUserController = new ListStoreUserController();
    await listStoreUserController.handle(req, res);
})

// deletando um usuário
router.delete("/store/user", authenticated, authorized("DELETE", "STORE_USER"), async (req: Request, res: Response): Promise<void> => {
    const deleteStoreUserController = new DeleteStoreUserController();
    await deleteStoreUserController.handle(req, res);
})

// CATEGORY ROUTES

// criando uma categoria
router.post("/category", authenticated, authorized("POST", "CATEGORY"), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const createCategoryController = new CreateCategoryController();
    await createCategoryController.handle(req, res);
})

// listando categorias
router.get("/category", authenticated, authorized("GET", "CATEGORY"), async (req: Request, res: Response): Promise<void> => {
    const listCategoryController = new ListCategoryController();
    await listCategoryController.handle(req, res);
})

// atualizando uma categoria
router.put("/category", authenticated, authorized("PUT", "CATEGORY"), async (req: Request, res: Response): Promise<void> => {
    const updateCategoryController = new UpdateCategoryController();
    await updateCategoryController.handle(req, res);
});

// deletando uma categoria
router.delete("/category", authenticated, authorized("DELETE", "CATEGORY"), async (req: Request, res: Response): Promise<void> => {
    const deleteCategoryController = new DeleteCategoryController();
    await deleteCategoryController.handle(req, res);
});

// PRODUCT ROUTES

// criando um produto
router.post("/product", authenticated, authorized("POST", "PRODUCT"), async (req: Request, res: Response): Promise<void> => {
    const createProductController = new CreateProductController();
    await createProductController.handle(req, res);
})

// listando produtos
router.get("/product", authenticated, authorized("GET", "PRODUCT"), async (req: Request, res: Response): Promise<void> => {
    const listProductController = new ListProductController();
    await listProductController.handle(req, res);
})

// atualizando um produto
router.put("/product", authenticated, authorized("PUT", "PRODUCT"), async (req: Request, res: Response): Promise<void> => {
    const updateProductController = new UpdateProductController();
    await updateProductController.handle(req, res);
});

// deletando um produto
router.delete("/product", authenticated, authorized("DELETE", "PRODUCT"), async (req: Request, res: Response): Promise<void> => {
    const deleteProductController = new DeleteProductController();
    await deleteProductController.handle(req, res);
});

// STOCK ROUTES

// criando um movimento
router.post("/stock", authenticated, authorized("POST", "STOCK"), async (req: Request, res: Response): Promise<void> => {
    const createStockController = new CreateStockController();
    await createStockController.handle(req, res);
})

// revertendo um movimento
router.post("/revertMoviment", authenticated, authorized("POST", "STOCK"), async (req: Request, res: Response): Promise<void> => {
    const revertStockController = new RevertStockController();
    await revertStockController.handle(req, res);
})

// listando movimentos
router.get("/stockMoviment", authenticated, authorized("GET", "STOCK"), async (req: Request, res: Response): Promise<void> => {
    const listMovimentStockController = new ListMovimentStockController();
    await listMovimentStockController.handle(req, res);
})

export { router };