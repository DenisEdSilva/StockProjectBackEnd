import { Router, Request, Response, NextFunction } from "express";

interface RequestWithToken extends Request {
    userId: number;
    token: string;
}

// PERMISSION CONTROLLERS
import { CreatePermissionController } from "./controllers/permission/CreatePermissionController";

// USER CONTROLLERS
import { CreateUserController } from "./controllers/user/CreateUserController";
import { DetailUserController } from "./controllers/user/DetailUserController";
import { UpdateUserController } from "./controllers/user/UpdateUserController";
import { DeleteUserController } from "./controllers/user/DeleteUserController";
import { AuthUserController } from "./controllers/user/AuthUserController";

// STORE CONTROLLERS
import { CreateStoreController } from "./controllers/store/CreateStoreController";
import { ListStoreController } from "./controllers/store/ListStoreController";
import { GetStoreByIdController } from "./controllers/store/GetStoreByIdController";
import { UpdateStoreController } from "./controllers/store/UpdateStoreController";
import { RevertDeleteStoreController } from "./controllers/store/RevertDeleteStoreController";
import { DeleteStoreController } from "./controllers/store/DeleteStoreController";

// ROLE CONTROLLERS
import { CreateRoleController } from "./controllers/role/CreateRoleController";
import { ListRoleController } from "./controllers/role/ListRoleController";
import { UpdateRoleController } from "./controllers/role/UpdateRoleController";
import { DeleteRoleController } from "./controllers/role/DeleteRoleController";

// STORE USERS CONTROLLERS
import { CreateStoreUserController } from "./controllers/storeUser/CreateStoreUserController";
import { ListStoreUserController } from "./controllers/storeUser/ListStoreUserController";
import { UpdateStoreUserController } from "./controllers/storeUser/UpdateStoreUserController";
import { AuthStoreUserController } from "./controllers/storeUser/AuthStoreUserController";
import { DeleteStoreUserController } from "./controllers/storeUser/DeleteStoreUserController";

// CATEGORY CONTROLLERS
import { CreateCategoryController } from "./controllers/category/CreateCategoryController";
import { ListCategoryController } from "./controllers/category/ListCategoryController";
import { UpdateCategoryController } from "./controllers/category/UpdateCategoryController";
import { DeleteCategoryController } from "./controllers/category/DeleteCategoryController";

// PRODUCT CONTROLLERS
import { CreateProductController } from "./controllers/products/CreateProductController";
import { ListProductController } from "./controllers/products/ListProductController";
import { UpdateProductController } from "./controllers/products/UpdateProductController";
import { DeleteProductController } from "./controllers/products/DeleteProductController";

// STOCK CONTROLLERS
import { CreateStockController } from "./controllers/stock/CreateStockController";
import { ListMovimentStockController } from "./controllers/stock/ListMovimentStockController";
import { RevertStockController } from "./controllers/stock/RevertStockController";

// AUDIT CONTROLLERS
import { AuditLogController } from "./controllers/audit/AuditLogController";

// MIDDLEWARES
import { authenticated } from "./middlewares/authenticated";
import { authorized } from "./middlewares/authorized";

const router = Router();

// PERMISSION ROUTES
router.post("/permissions",
  (req: Request, res: Response) => {
    new CreatePermissionController().handle(req, res,);
  }
);

// USER ROUTES
router.post("/users",
  (req: Request, res: Response, next: NextFunction) => {
    new CreateUserController().handle(req, res, next);
  }
);

router.post("/sessions",
  (req: Request, res: Response, next: NextFunction) => {
    new AuthUserController().handle(req, res, next);
  }
);

router.get("/me",
  authenticated,
  authorized("GET", "USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new DetailUserController().handle(req, res, next);
  }
);

router.put("/me/:userId",
  authenticated,
  authorized("PUT", "USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new UpdateUserController().handle(req, res, next);
  }
);

router.delete("/me/:id",
  authenticated,
  authorized("DELETE", "USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new DeleteUserController().handle(req, res, next);
  }
);

// STORE ROUTES
router.post("/stores",
  authenticated,
  authorized("POST", "STORE"),
  (req: Request, res: Response, next: NextFunction) => {
    new CreateStoreController().handle(req, res, next);
  }
);

router.get("/stores",
  authenticated,
  authorized("GET", "STORE"),
  (req: Request, res: Response, next: NextFunction) => {
    new ListStoreController().handle(req, res, next);
  }
);

router.get("/stores/store/:storeId",
  authenticated,
  authorized("GET", "STORE"),
  (req: Request, res: Response, next: NextFunction) => {
    new GetStoreByIdController().handle(req, res, next);
  }
);

router.put("/stores/:storeId",
  authenticated,
  authorized("PUT", "STORE"),
  (req: Request, res: Response, next: NextFunction) => {
    new UpdateStoreController().handle(req, res, next);
  }
);

router.put("/stores/:storeId/revert",
  authenticated,
  authorized("PUT", "STORE_DELETE"),
  (req: Request, res: Response, next: NextFunction) => {
    new RevertDeleteStoreController().handle(req, res, next);
  }
);

router.delete("/stores/:storeId",
  authenticated,
  authorized("DELETE", "STORE"),
  (req: Request, res: Response, next: NextFunction) => {
    new DeleteStoreController().handle(req, res, next);
  }
);


// ROLE ROUTES
router.post("/stores/:storeId/roles/",
  authenticated,
  authorized("POST", "ROLE"),
  (req: Request, res: Response, next: NextFunction) => {
    new CreateRoleController().handle(req, res, next);
  }
);

router.get("/stores/:storeId/roles/",
  authenticated,
  authorized("GET", "ROLE"),
  (req: Request, res: Response, next: NextFunction) => {
    new ListRoleController().handle(req, res, next);
  }
);

router.put("/stores/:storeId/roles/:roleId",
  authenticated,
  authorized("PUT", "ROLE"),
  (req: Request, res: Response, next: NextFunction) => {
    new UpdateRoleController().handle(req, res, next);
  }
);

router.delete("/stores/:storeId/roles/:roleId",
  authenticated,
  authorized("DELETE", "ROLE"),
  (req: Request, res: Response, next: NextFunction) => {
    new DeleteRoleController().handle(req, res, next);
  }
);

// STORE USER ROUTES
router.post("/stores/:storeId/users",
  authenticated,
  authorized("POST", "STORE_USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new CreateStoreUserController().handle(req, res, next);
  }
);

router.post("/stores/:storeId/sessions",
  (req: Request, res: Response, next: NextFunction) => {
    new AuthStoreUserController().handle(req, res, next);
  }
);

router.get("/stores/:storeId/users",
  authenticated,
  authorized("GET", "STORE_USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new ListStoreUserController().handle(req, res, next);
  }
);

router.put("/stores/:storeId/users/:storeUserId",
  authenticated,
  authorized("PUT", "STORE_USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new UpdateStoreUserController().handle(req, res, next);
  }
);

router.delete("/stores/:storeId/users/:storeUserId",
  authenticated,
  authorized("DELETE", "STORE_USER"),
  (req: Request, res: Response, next: NextFunction) => {
    new DeleteStoreUserController().handle(req, res, next);
  }
);

// CATEGORY ROUTES
router.post("/stores/:storeId/categories",
  authenticated,
  authorized("POST", "CATEGORY"),
  (req: Request, res: Response, next: NextFunction) => {
    new CreateCategoryController().handle(req, res, next);
  }
);

router.get("/stores/:storeId/categories",
  authenticated,
  authorized("GET", "CATEGORY"),
  (req: Request, res: Response, next: NextFunction) => {
    new ListCategoryController().handle(req, res, next);
  }
);

router.put("/stores/:storeId/categories/:categoryId",
  authenticated,
  authorized("PUT", "CATEGORY"),
  (req: Request, res: Response, next: NextFunction) => {
    new UpdateCategoryController().handle(req, res, next);
  }
);

router.delete("/stores/:storeId/categories/:categoryId",
  authenticated,
  authorized("DELETE", "CATEGORY"),
  (req: Request, res: Response, next: NextFunction) => {
    new DeleteCategoryController().handle(req, res, next);
  }
);

// PRODUCT ROUTES
router.post("/stores/:storeId/categories/:categoryId/products",
  authenticated,
  authorized("POST", "PRODUCT"),
  (req: Request, res: Response, next: NextFunction) => {
    new CreateProductController().handle(req, res, next);
  }
);

router.get("/stores/:storeId/categories/:categoryId/products",
  authenticated,
  authorized("GET", "PRODUCT"),
  (req: Request, res: Response, next: NextFunction) => {
    new ListProductController().handle(req, res, next);
  }
);

router.put("/stores/:storeId/categories/:categoryId/products/:productId",
  authenticated,
  authorized("PUT", "PRODUCT"),
  (req: Request, res: Response, next: NextFunction) => {
    new UpdateProductController().handle(req, res, next);
  }
);

router.delete("/stores/:storeId/categories:categoryId/products/:productId",
  authenticated,
  authorized("DELETE", "PRODUCT"),
  (req: Request, res: Response, next: NextFunction) => {
    new DeleteProductController().handle(req, res, next);
  }
);

// STOCK ROUTES
router.post("/stores/:storeId/products/:productId/stocks/movements",
  authenticated,
  authorized("POST", "STOCK"),
  (req: Request, res: Response, next: NextFunction) => {
    new CreateStockController().handle(req, res, next);
  }
);

router.get("/stores/:storeId/products/:productId/stocks/movements",
  authenticated,
  authorized("GET", "STOCK"),
  (req: Request, res: Response, next: NextFunction) => {
    new ListMovimentStockController().handle(req, res, next);
  }
);

router.post("/stores/:storeId/products/:productId/stocks/movements/:movementId/revert",
  authenticated,
  authorized("POST", "STOCK"),
  (req: Request, res: Response, next: NextFunction) => {
    new RevertStockController().handle(req, res, next);
  }
);

// AUDIT ROUTES
router.get("/audit-logs",
  authenticated,
  authorized("GET", "AUDIT_LOG"),
  (req: Request, res: Response, next: NextFunction) => {
    new AuditLogController().handle(req, res, next);
  }
);

export { router };