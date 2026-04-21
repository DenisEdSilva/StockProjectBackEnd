import { Router, Request, Response, NextFunction } from "express";

// --- SHARED & UTILS ---
import { AccessControlProvider } from "./shared/AccessControlProvider";
import { ActivityTracker } from "./services/activity/ActivityTracker";
import { CreateAuditLogService } from "./services/audit/CreateAuditLogService";

// MIDDLEWARES
import { authenticated } from "./middlewares/authenticated";
import { authorized } from "./middlewares/authorized";

// INFRA 
const aclProvider = new AccessControlProvider();
const tracker = new ActivityTracker();
const auditLogCreate = new CreateAuditLogService();

// PERMISSION CONTROLLERS & SERVICES
import { CreatePermissionController } from "./controllers/permission/CreatePermissionController";
import { CreatePermissionService } from "./services/permission/CreatePermissionService";
const createPermissionService = new CreatePermissionService();
const createPermissionController = new CreatePermissionController(createPermissionService);

import { ListPermissionController } from "./controllers/permission/ListPermissionController";
import { ListPermissionService } from "./services/permission/ListPermissionService";
const listPermissionService = new ListPermissionService();
const listPermissionController = new ListPermissionController(listPermissionService);

// AUTH AND ME CONTROLLERS & SERVICES
import { SignInController } from "./controllers/auth/SignInController";
import { SignInService } from "./services/auth/SignInService";
const signInService = new SignInService(auditLogCreate, tracker, aclProvider);
const signInController = new SignInController(signInService);

import { MeController } from "./controllers/me/MeController";
import { MeService } from "./services/me/MeService";
const meService = new MeService(aclProvider);
const meController = new MeController(meService);

// USER CONTROLLERS & SERVICES
import { CreateUserController } from "./controllers/user/CreateUserController";
import { CreateUserService } from "./services/user/CreateUserService";
const createUserService = new CreateUserService(auditLogCreate);
const createUserController = new CreateUserController(createUserService);

import { DetailUserController } from "./controllers/user/DetailUserController";
import { DetailUserService } from "./services/user/DetailUserService";
const detailUserService = new DetailUserService(auditLogCreate);
const detailUserController = new DetailUserController(detailUserService);

import { GetOwnerByIdController } from "./controllers/user/GetOwnerByIdController";
import { GetOwnerByIdService } from "./services/user/GetOwnerByIdService";
const getOwnerByIdService = new GetOwnerByIdService();
const getOwnerByIdController = new GetOwnerByIdController(getOwnerByIdService);

import { UpdateUserController } from "./controllers/user/UpdateUserController";
import { UpdateUserService } from "./services/user/UpdateUserService";
const updateUserService = new UpdateUserService(auditLogCreate, tracker);
const updateUserController = new UpdateUserController(updateUserService);

import { DeleteUserController } from "./controllers/user/DeleteUserController";
import { DeleteUserService } from "./services/user/DeleteUserService";
const deleteUserService = new DeleteUserService(auditLogCreate);
const deleteUserController = new DeleteUserController(deleteUserService);

// STORE CONTROLLERS & SERVICES
import { CreateStoreController } from "./controllers/store/CreateStoreController";
import { CreateStoreService } from "./services/store/CreateStoreService";
const createStoreService = new CreateStoreService(auditLogCreate, tracker);
const createStoreController = new CreateStoreController(createStoreService);

import { ListStoreController } from "./controllers/store/ListStoreController";
import { ListStoreService } from "./services/store/ListStoreService";
const listStoreService = new ListStoreService();
const listStoreController = new ListStoreController(listStoreService);

import { GetStoreByIdController } from "./controllers/store/GetStoreByIdController";
import { GetStoreByIdService } from "./services/store/GetStoreByIdService";
const getStoreByIdService = new GetStoreByIdService();
const getStoreByIdController = new GetStoreByIdController(getStoreByIdService);

import { GetStoreUserByIdController } from "./controllers/storeUser/GetStoreUserByIdController";
import { GetStoreUserByIdService } from "./services/storeUser/GetStoreUserByIdService";
const getStoreUserByIdService = new GetStoreUserByIdService();
const getStoreUserByIdController = new GetStoreUserByIdController(getStoreUserByIdService);

import { UpdateStoreController } from "./controllers/store/UpdateStoreController";
import { UpdateStoreService } from "./services/store/UpdateStoreService";
const updateStoreService = new UpdateStoreService(auditLogCreate, tracker);
const updateStoreController = new UpdateStoreController(updateStoreService);

import { RevertDeleteStoreController } from "./controllers/store/RevertDeleteStoreController";
import { RevertDeleteStoreService } from "./services/store/RevertDeleteStoreService";
const revertDeleteStoreService = new RevertDeleteStoreService(auditLogCreate, tracker);
const revertDeleteStoreController = new RevertDeleteStoreController(revertDeleteStoreService);

import { DeleteStoreController } from "./controllers/store/DeleteStoreController";
import { DeleteStoreService } from "./services/store/DeleteStoreService";
const deleteStoreService = new DeleteStoreService(auditLogCreate, tracker);
const deleteStoreController = new DeleteStoreController(deleteStoreService);

// ROLE CONTROLLERS & SERVICES
import { CreateRoleController } from "./controllers/role/CreateRoleController";
import { CreateRoleService } from "./services/role/CreateRoleService";
const createRoleService = new CreateRoleService(auditLogCreate, tracker);
const createRoleController = new CreateRoleController(createRoleService);

import { ListRoleController } from "./controllers/role/ListRoleController";
import { ListRoleService } from "./services/role/ListRoleService";
const listRoleService = new ListRoleService();
const listRoleController = new ListRoleController(listRoleService);

import { GetRoleByIdController } from "./controllers/role/GetRoleByIdController";
import { GetRoleByIdService } from "./services/role/GetRoleByIdService";
const getRoleByIdService = new GetRoleByIdService();
const getRoleByIdController = new GetRoleByIdController(getRoleByIdService);

import { UpdateRoleController } from "./controllers/role/UpdateRoleController";
import { UpdateRoleService } from "./services/role/UpdateRoleService";
const updateRoleService = new UpdateRoleService(auditLogCreate, tracker);
const updateRoleController = new UpdateRoleController(updateRoleService);

import { DeleteRoleController } from "./controllers/role/DeleteRoleController";
import { DeleteRoleService } from "./services/role/DeleteRoleService";
const deleteRoleService = new DeleteRoleService(auditLogCreate, tracker);
const deleteRoleController = new DeleteRoleController(deleteRoleService);

// STORE USERS CONTROLLERS & SERVICES
import { CreateStoreUserController } from "./controllers/storeUser/CreateStoreUserController";
import { CreateStoreUserService } from "./services/storeUser/CreateStoreUserService";
const createStoreUserService = new CreateStoreUserService(auditLogCreate, tracker);
const createStoreUserController = new CreateStoreUserController(createStoreUserService);

import { ListStoreUserController } from "./controllers/storeUser/ListStoreUserController";
import { ListStoreUserService } from "./services/storeUser/ListStoreUserService";
const listStoreUserService = new ListStoreUserService();
const listStoreUserController = new ListStoreUserController(listStoreUserService);

import { UpdateStoreUserController } from "./controllers/storeUser/UpdateStoreUserController";
import { UpdateStoreUserService } from "./services/storeUser/UpdateStoreUserService";
const updateStoreUserService = new UpdateStoreUserService(auditLogCreate, tracker);
const updateStoreUserController = new UpdateStoreUserController(updateStoreUserService);

import { DeleteStoreUserController } from "./controllers/storeUser/DeleteStoreUserController";
import { DeleteStoreUserService } from "./services/storeUser/DeleteStoreUserService";
const deleteStoreUserService = new DeleteStoreUserService(auditLogCreate, tracker);
const deleteStoreUserController = new DeleteStoreUserController(deleteStoreUserService);

// CATEGORY CONTROLLERS & SERVICES
import { CreateCategoryController } from "./controllers/category/CreateCategoryController";
import { CreateCategoryService } from "./services/category/CreateCategoryService";
const createCategoryService = new CreateCategoryService(auditLogCreate, tracker);
const createCategoryController = new CreateCategoryController(createCategoryService);

import { ListCategoryController } from "./controllers/category/ListCategoryController";
import { ListCategoryService } from "./services/category/ListCategoryService";
const listCategoryService = new ListCategoryService();
const listCategoryController = new ListCategoryController(listCategoryService);

import { GetCategoryByIdController } from "./controllers/category/GetCategoryByIdController";
import { GetCategoryByIdService } from "./services/category/GetCategoryByIdService";
const getCategoryByIdService = new GetCategoryByIdService();
const getCategoryByIdController = new GetCategoryByIdController(getCategoryByIdService);

import { UpdateCategoryController } from "./controllers/category/UpdateCategoryController";
import { UpdateCategoryService } from "./services/category/UpdateCategoryService";
const updateCategoryService = new UpdateCategoryService(auditLogCreate, tracker);
const updateCategoryController = new UpdateCategoryController(updateCategoryService);

import { DeleteCategoryController } from "./controllers/category/DeleteCategoryController";
import { DeleteCategoryService } from "./services/category/DeleteCategoryService";
const deleteCategoryService = new DeleteCategoryService(auditLogCreate, tracker);
const deleteCategoryController = new DeleteCategoryController(deleteCategoryService);

// PRODUCT CONTROLLERS & SERVICES
import { CreateProductController } from "./controllers/products/CreateProductController";
import { CreateProductService } from "./services/products/CreateProductService";
const createProductService = new CreateProductService(auditLogCreate, tracker);
const createProductController = new CreateProductController(createProductService);

import { ListProductController } from "./controllers/products/ListProductController";
import { ListProductService } from "./services/products/ListProductService";
const listProductService = new ListProductService();
const listProductController = new ListProductController(listProductService);

import { GetProductByIdController } from "./controllers/products/GetProductByIdController";
import { GetProductByIdService } from "./services/products/GetProductByIdService";
const getProductByIdService = new GetProductByIdService();
const getProductByIdController = new GetProductByIdController(getProductByIdService);

import { UpdateProductController } from "./controllers/products/UpdateProductController";
import { UpdateProductService } from "./services/products/UpdateProductService";
const updateProductService = new UpdateProductService(auditLogCreate, tracker);
const updateProductController = new UpdateProductController(updateProductService);

import { DeleteProductController } from "./controllers/products/DeleteProductController";
import { DeleteProductService } from "./services/products/DeleteProductService";
const deleteProductService = new DeleteProductService(auditLogCreate, tracker);
const deleteProductController = new DeleteProductController(deleteProductService);

// STOCK CONTROLLERS & SERVICES
import { CreateStockController } from "./controllers/stock/CreateStockController";
import { CreateStockService } from "./services/stock/CreateStockService";
const createStockService = new CreateStockService(auditLogCreate, tracker);
const createStockController = new CreateStockController(createStockService);

import { ListMovimentStockController } from "./controllers/stock/ListMovimentStockController";
import { ListMovimentStockService } from "./services/stock/ListMovimentStockService";
const listMovimentStockService = new ListMovimentStockService(auditLogCreate, tracker);
const listMovimentStockController = new ListMovimentStockController(listMovimentStockService);

import { RevertStockController } from "./controllers/stock/RevertStockController";
import { RevertStockService } from "./services/stock/RevertStockService";
const revertStockService = new RevertStockService(auditLogCreate, tracker);
const revertStockController = new RevertStockController(revertStockService);

// AUDIT CONTROLLERS & SERVICES
import { AuditLogController } from "./controllers/audit/AuditLogController";
import { AuditLogService } from "./services/audit/AuditLogService";
const auditLogService = new AuditLogService();
const auditLogController = new AuditLogController(auditLogService);

const router = Router();

// PERMISSION ROUTES
router.post("/permissions",
	(req: Request, res: Response, next: NextFunction) => {
		createPermissionController.handle(req, res, next);
	}
);

router.get("/permissions",
	(req: Request, res: Response, next: NextFunction) => {
		listPermissionController.handle(req, res, next);
	}
);

// BASIC ROUTES
router.get("/me",
	authenticated,
	(req: Request, res: Response, next: NextFunction) => {
		meController.handle(req, res, next);
	}
);

router.post('/logout', 
	authenticated,
	(req: Request, res: Response) => {
			res.clearCookie('access_token', {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					path: '/',
					domain: process.env.NODE_ENV === 'development' ? 'localhost' : undefined
			});
			res.json({ success: true });
	}
);

// AUTH ROUTES
router.post("/auth/signIn",
	(req: Request, res: Response, next: NextFunction) => {
		signInController.handle(req, res, next);
	}
);

// USER ROUTES
router.post("/users",
	(req: Request, res: Response, next: NextFunction) => {
		createUserController.handle(req, res, next);
	}
);

router.get("/users/me",
	authenticated,
	(req: Request, res: Response, next: NextFunction) => {
		detailUserController.handle(req, res, next);
	}
);

router.get("/users/:ownerId",
	authenticated,
	(req: Request, res: Response, next: NextFunction) => {
		getOwnerByIdController.handle(req, res, next);
	}
)

router.put("/users/me/:userId",
	authenticated,
	(req: Request, res: Response, next: NextFunction) => {
		updateUserController.handle(req, res, next);
	}
);

router.delete("/users/me/:id",
	authenticated,
	(req: Request, res: Response, next: NextFunction) => {
		deleteUserController.handle(req, res, next);
	}
);

// STORE ROUTES
router.post("/stores",
	authenticated,
	authorized("POST", "STORE"),
	(req: Request, res: Response, next: NextFunction) => {
		createStoreController.handle(req, res, next);
	}
);

router.get("/stores",
	authenticated,
	(req: Request, res: Response, next: NextFunction) => {
		listStoreController.handle(req, res, next);
	}
);

router.get("/stores/:storeId",
	authenticated,
	authorized("GET", "STORE"),
	(req: Request, res: Response, next: NextFunction) => {
		getStoreByIdController.handle(req, res, next);
	}
);

router.put("/stores/:storeId",
	authenticated,
	authorized("PUT", "STORE"),
	(req: Request, res: Response, next: NextFunction) => {
		updateStoreController.handle(req, res, next);
	}
);

router.put("/stores/:storeId/revert",
	authenticated,
	authorized("PUT", "STORE_DELETE"),
	(req: Request, res: Response, next: NextFunction) => {
		revertDeleteStoreController.handle(req, res, next);
	}
);

router.delete("/stores/:storeId",
	authenticated,
	authorized("DELETE", "STORE"),
	(req: Request, res: Response, next: NextFunction) => {
		deleteStoreController.handle(req, res, next);
	}
);


// ROLE ROUTES
router.post("/stores/:storeId/roles",
	authenticated,
	authorized("POST", "ROLE"),
	(req: Request, res: Response, next: NextFunction) => {
		createRoleController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/roles",
	authenticated,
	authorized("GET", "ROLE"),
	(req: Request, res: Response, next: NextFunction) => {
		listRoleController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/roles/:roleId",
	authenticated,
	authorized("GET", "ROLE"),
	(req: Request, res: Response, next: NextFunction) => {
		getRoleByIdController.handle(req, res, next);
	})

router.put("/stores/:storeId/roles/:roleId",
	authenticated,
	authorized("PUT", "ROLE"),
	(req: Request, res: Response, next: NextFunction) => {
		updateRoleController.handle(req, res, next);
	}
);

router.delete("/stores/:storeId/roles/:roleId",
	authenticated,
	authorized("DELETE", "ROLE"),
	(req: Request, res: Response, next: NextFunction) => {
		deleteRoleController.handle(req, res, next);
	}
);

// STORE USER ROUTES
router.post("/stores/:storeId/users",
	authenticated,
	authorized("POST", "STORE_USER"),
	(req: Request, res: Response, next: NextFunction) => {
		createStoreUserController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/users",
	authenticated,
	authorized("GET", "STORE_USER"),
	(req: Request, res: Response, next: NextFunction) => {
		listStoreUserController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/users/:storeUserId", 
	authenticated,
	authorized("GET", "STORE_USER"),
	(req: Request, res: Response, next: NextFunction) => {
		getStoreUserByIdController.handle(req, res, next);
	}
);


router.put("/stores/:storeId/users/:storeUserId",
	authenticated,
	authorized("PUT", "STORE_USER"),
	(req: Request, res: Response, next: NextFunction) => {
		updateStoreUserController.handle(req, res, next);
	}
);

router.delete("/stores/:storeId/users/:storeUserId",
	authenticated,
	authorized("DELETE", "STORE_USER"),
	(req: Request, res: Response, next: NextFunction) => {
		deleteStoreUserController.handle(req, res, next);
	}
);

// CATEGORY ROUTES
router.post("/stores/:storeId/categories",
	authenticated,
	authorized("POST", "CATEGORY"),
	(req: Request, res: Response, next: NextFunction) => {
		createCategoryController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/categories",
	authenticated,
	authorized("GET", "CATEGORY"),
	(req: Request, res: Response, next: NextFunction) => {
		listCategoryController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/categories/:categoryId",
	authenticated,
	authorized("GET", "CATEGORY"),
	(req: Request, res: Response, next: NextFunction) => {
		getCategoryByIdController.handle(req, res, next);
	}
);

router.put("/stores/:storeId/categories/:categoryId",
	authenticated,
	authorized("PUT", "CATEGORY"),
	(req: Request, res: Response, next: NextFunction) => {
		updateCategoryController.handle(req, res, next);
	}
);

router.delete("/stores/:storeId/categories/:categoryId",
	authenticated,
	authorized("DELETE", "CATEGORY"),
	(req: Request, res: Response, next: NextFunction) => {
		deleteCategoryController.handle(req, res, next);
	}
);

// PRODUCT ROUTES
router.post("/stores/:storeId/products",
	authenticated,
	authorized("POST", "PRODUCT"),
	(req: Request, res: Response, next: NextFunction) => {
		createProductController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/products",
	authenticated,
	authorized("GET", "PRODUCT"),
	(req: Request, res: Response, next: NextFunction) => {
		listProductController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/products/:productId",
	authenticated,
	authorized("GET", "PRODUCT"),
	(req: Request, res: Response, next: NextFunction) => {
		getProductByIdController.handle(req, res, next);
	}
);

router.put("/stores/:storeId/products/:productId",
	authenticated,
	authorized("PUT", "PRODUCT"),
	(req: Request, res: Response, next: NextFunction) => {
		updateProductController.handle(req, res, next);
	}
);

router.delete("/stores/:storeId/products/:productId",
	authenticated,
	authorized("DELETE", "PRODUCT"),
	(req: Request, res: Response, next: NextFunction) => {
		deleteProductController.handle(req, res, next);
	}
);

// STOCK ROUTES
router.post("/stores/:storeId/stock/movements",
	authenticated,
	authorized("POST", "STOCK"),
	(req: Request, res: Response, next: NextFunction) => {
		createStockController.handle(req, res, next);
	}
);

router.get("/stores/:storeId/stock/movements",
	authenticated,
	authorized("GET", "STOCK"),
	(req: Request, res: Response, next: NextFunction) => {
		listMovimentStockController.handle(req, res, next);
	}
);

router.patch("/stores/:storeId/stock/movements/:movementId/revert",
	authenticated,
	authorized("PATCH", "STOCK"),
	(req: Request, res: Response, next: NextFunction) => {
		revertStockController.handle(req, res, next);
	}
);

// AUDIT ROUTES
router.get("/stores/:storeId/auditLogs",
	authenticated,
	authorized("GET", "AUDIT_LOG"),
	(req: Request, res: Response, next: NextFunction) => {
		auditLogController.handle(req, res, next);
	}
);

export { router };