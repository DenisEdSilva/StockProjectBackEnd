import { SignInService } from "./SignInService";
import prismaClient from "../../prisma";
import { redisClient } from "@/redis.config";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "@/errors";

jest.mock("../../prisma", () => ({
	__esModule: true,
	default: {
		$transaction: jest.fn()
	}
}));

jest.mock("bcryptjs", () => ({
  	compare: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  	sign: jest.fn()
}));

jest.mock("../../redis.config", () => ({
  redisClient: {
    isOpen: true,
    setEx: jest.fn()
  }
}));

describe("SignInService", () => {
	let service: SignInService;

	const auditLogMock = {
		create: jest.fn()
	};

	const activityTrackerMock = {
		track: jest.fn()
	};

	const aclMock = {
		uintToACL: jest.fn()
	};

	beforeEach(() => {
		jest.clearAllMocks();

		service = new SignInService(
		auditLogMock as any,
		activityTrackerMock as any,
		aclMock as any
		);
	});

	describe("AUTHENTICATION", () => {
    	it("should throw if user does not exist", async () => {
			const mockTx = {
				user: {
				findUnique: jest.fn().mockResolvedValue(null)
				},
				storeUser: {
				findFirst: jest.fn().mockResolvedValue(null)
				}
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			await expect(service.execute({
				email: "nonexistent@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			})).rejects.toThrow(UnauthorizedError);

			expect(prismaClient.$transaction).toHaveBeenCalled();
		});

		it("should throw if password is incorrect", async () => {
			const mockUser = {
				id: 1,
				name: "Denis",
				email: "denis@email.com",
				password: "hashed-password",
				isOwner: true,
				markedForDeletionAt: null,
				ownedStores: [{ id: 10, name: "Store A", isDeleted: false }]
			};

			const mockTx = {
				user: {
				findUnique: jest.fn().mockResolvedValue(mockUser)
				},
				storeUser: {
				findFirst: jest.fn().mockResolvedValue(null)
				}
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			const mockedCompare = compare as jest.Mock<
				Promise<boolean>,
				[string, string]
			>;

			mockedCompare.mockResolvedValue(false);

			await expect(service.execute({
				email: "denis@email.com",
				password: "WrongPassword123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			})).rejects.toThrow(UnauthorizedError);

			expect(prismaClient.$transaction).toHaveBeenCalled();
			expect(compare).toHaveBeenCalledWith(
				"WrongPassword123",
				"hashed-password"
			);

			expect(sign).not.toHaveBeenCalled();
			expect(redisClient.setEx).not.toHaveBeenCalled();
			expect(activityTrackerMock.track).not.toHaveBeenCalled();
			expect(auditLogMock.create).not.toHaveBeenCalled();
		});
	});


	describe("OWNER flow", () => {
		it("should login OWNER successfully", async () => {
			const mockOwner = {
				id: 1,
				name: "Denis",
				email: "denis@email.com",
				password: "hashed-password",
				isOwner: true,
				markedForDeletionAt: null,
				ownedStores: [{ id: 10, name: "Store A", isDeleted: false }]
			};

			const mockTx = {
				user: {
					findUnique: jest.fn().mockResolvedValue(mockOwner)
				},
				storeUser: {
					findFirst: jest.fn().mockResolvedValue(null)
				}
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			(compare as jest.Mock).mockResolvedValue(true);
			(sign as jest.Mock).mockReturnValue("fake-jwt-token");

			process.env.JWT_SECRET = "test-secret";

			const result = await service.execute({
				email: "denis@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			});

			expect(sign).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 1,
					type: "OWNER"
				}),
				"test-secret",
				expect.objectContaining({ expiresIn: "30d" })
			);

			expect(result.token).toBe("fake-jwt-token");

			expect(result.user).toEqual({
				id: 1,
				name: "Denis",
				email: "denis@email.com",
				type: "OWNER",
				ownedStores: mockOwner.ownedStores
			});

			expect(compare).toHaveBeenCalledWith(
				"Password123",
				"hashed-password"
			);

			expect(activityTrackerMock.track).toHaveBeenCalledWith(
				expect.objectContaining({
					ownerId: 1,
					tx: expect.anything()
				})
			);

			expect(auditLogMock.create).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "USER_LOGIN",
					userId: 1,
					isOwner: true,
					ipAddress: "127.0.0.1",
					userAgent: "jest"
				}),
				expect.anything()
			);

			const [key, ttl, payload] = (redisClient.setEx as jest.Mock).mock.calls[0];

			expect(key).toBe("owner:1");
			expect(ttl).toBe(60 * 60 * 24 * 30);

			const parsed = JSON.parse(payload);

			expect(parsed).toEqual(
				expect.objectContaining({
					id: 1,
					email: "denis@email.com"
				})
			);
		});

		it("should throw if account is marked for deletion", async () => {
			const mockUser = {
				id: 1,
				name: "Denis",
				email: "denis@email.com",
				password: "hashed-password",
				isOwner: true,
				markedForDeletionAt: new Date(),
				ownedStores: [{ id: 10, name: "Store A", isDeleted: false }]
			};

			const mockTx = {
				user: {
				findUnique: jest.fn().mockResolvedValue(mockUser)
				},
				storeUser: {
				findFirst: jest.fn().mockResolvedValue(null)
				}
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			const mockedCompare = compare as jest.Mock<
				Promise<boolean>,
				[string, string]
			>;
			mockedCompare.mockResolvedValue(true);

			await expect(service.execute({
				email: "denis@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			})).rejects.toThrow(ForbiddenError);

			expect(prismaClient.$transaction).toHaveBeenCalled();
			expect(compare).toHaveBeenCalledWith(
				"Password123",
				"hashed-password"
			);

			expect(sign).not.toHaveBeenCalled();
			expect(redisClient.setEx).not.toHaveBeenCalled();
			expect(activityTrackerMock.track).not.toHaveBeenCalled();
			expect(auditLogMock.create).not.toHaveBeenCalled();
		});
  	});

  	describe("STORE_USER flow", () => {
		it("should login STORE_USER successfully", async () => {
			const mockStoreUser = {
				id: 2,
				name: "Alice",
				email: "alice@email.com",
				password: "hashed-password",
				roleId: 4,
				storeId: 10,
				role: {
					permissions: [
						{ permission: { action: "GET", resource: "INVENTORY" } },
						{ permission: { action: "POST", resource: "INVENTORY" } }
					]
				}
			};

			const mockPermissions = [
				{ action: "GET", resource: "INVENTORY" },
				{ action: "POST", resource: "INVENTORY" }
			];

			const mockTx = {
				user: { findUnique: jest.fn().mockResolvedValue(null) },
				storeUser: { findFirst: jest.fn().mockResolvedValue(mockStoreUser) }
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			(compare as jest.Mock).mockResolvedValue(true);

			aclMock.uintToACL.mockResolvedValue({
				permissions: mockPermissions
			});

			(sign as jest.Mock).mockReturnValue("fake-jwt-token");
			process.env.JWT_SECRET = "test-secret";

			const result = await service.execute({
				email: "alice@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			});
			
			expect(result.token).toBe("fake-jwt-token");

			expect(sign).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 2,
					type: "STORE_USER",
					storeId: 10
				}),
				"test-secret",
				expect.objectContaining({ expiresIn: "30d" })
			);


			expect(result.user).toEqual({
				id: 2,
				name: "Alice",
				email: "alice@email.com",
				type: "STORE_USER",
				storeId: 10,
				roleId: 4,
				permissions: mockPermissions
			});

			expect(aclMock.uintToACL).toHaveBeenCalledWith(
				2,
				expect.anything()
			);

			expect(activityTrackerMock.track).toHaveBeenCalledWith(
				expect.objectContaining({
					storeUserId: 2,
					storeId: 10,
					tx: expect.anything()
				})
			);

			expect(auditLogMock.create).toHaveBeenCalledWith(
				expect.objectContaining({
					action: "STORE_USER_LOGIN",
					storeUserId: 2,
					storeId: 10,
					ipAddress: "127.0.0.1",
					userAgent: "jest",
					isOwner: false
				}),
				expect.anything()
			);

			const [key, ttl, payload] = (redisClient.setEx as jest.Mock).mock.calls[0];
			
			expect(key).toBe("store:10:user:2");
			expect(ttl).toBe(60 * 60 * 24 * 30);

			const parsed = JSON.parse(payload);

			expect(parsed).toEqual(
				expect.objectContaining({
					id: 2,
					email: "alice@email.com",
					storeId: 10
				})
			);
		});

		it("should throw if STORE_USER has no role", async () => {
			const mockStoreUser = {
				id: 2,
				name: "Alice",
				email: "alice@email.com",
				password: "hashed-password",
				roleId: 4,
				storeId: 10,
				role: null
			};

			const mockTx = {
				user: { findUnique: jest.fn().mockResolvedValue(null) },
				storeUser: { findFirst: jest.fn().mockResolvedValue(mockStoreUser) }
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			const mockedCompare = compare as jest.Mock<
				Promise<boolean>,
				[string, string]
			>;
			mockedCompare.mockResolvedValue(true);

			await expect(service.execute({
				email: "alice@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			})).rejects.toThrow(ForbiddenError);

			expect(sign).not.toHaveBeenCalled();
			expect(redisClient.setEx).not.toHaveBeenCalled();
			expect(activityTrackerMock.track).not.toHaveBeenCalled();
			expect(auditLogMock.create).not.toHaveBeenCalled();

		});

		it("should throw if ACL provider fails", async () => {
			const mockStoreUser = {
				id: 2,
				name: "Alice",
				email: "alice@email.com",
				password: "hashed-password",
				roleId: 4,
				storeId: 10,
				role: { permissions: [] }
			};

			const mockTx = {
				user: { findUnique: jest.fn().mockResolvedValue(null) },
				storeUser: { findFirst: jest.fn().mockResolvedValue(mockStoreUser) }
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			const mockedCompare = compare as jest.Mock<
				Promise<boolean>,
				[string, string]
			>;
			mockedCompare.mockResolvedValue(true);

			aclMock.uintToACL.mockRejectedValue(new Error("ACL failure"));

			await expect(service.execute({
				email: "alice@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			})).rejects.toThrow("ACL failure");

			expect(sign).not.toHaveBeenCalled();
			expect(redisClient.setEx).not.toHaveBeenCalled();
			expect(activityTrackerMock.track).not.toHaveBeenCalled();
			expect(auditLogMock.create).not.toHaveBeenCalled();
		});

		it("should throw if JWT_SECRET is missing", async () => {
			const mockStoreUser = {
				id: 2,
				name: "Alice",
				email: "alice@email.com",
				password: "hashed-password",
				roleId: 4,
				storeId: 10,
				role: { permissions: [] }
			};

			const mockTx = {
				user: { findUnique: jest.fn().mockResolvedValue(null) },
				storeUser: { findFirst: jest.fn().mockResolvedValue(mockStoreUser) }
			};

			(prismaClient.$transaction as jest.Mock).mockImplementation(
				async (callback) => callback(mockTx)
			);

			const mockedCompare = compare as jest.Mock<
				Promise<boolean>,
				[string, string]
			>;
			mockedCompare.mockResolvedValue(true);

			aclMock.uintToACL.mockResolvedValue({
				permissions: []
			});

			delete process.env.JWT_SECRET;

			await expect(service.execute({
				email: "alice@email.com",
				password: "Password123",
				ipAddress: "127.0.0.1",
				userAgent: "jest"
			})).rejects.toThrow("ServerConfigurationError");

			expect(sign).not.toHaveBeenCalled();
			expect(redisClient.setEx).not.toHaveBeenCalled();
			expect(activityTrackerMock.track).not.toHaveBeenCalled();
			expect(auditLogMock.create).not.toHaveBeenCalled();
		});
  	});
})