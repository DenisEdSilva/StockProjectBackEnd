import prismaClient from "../../prisma";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { 
    ValidationError, 
    NotFoundError, 
    UnauthorizedError 
} from "../../errors";

interface AuthRequest {
    storeId: number;
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

interface AuthResponse {
    id: number;
    name: string;
    email: string;
    roleId: number;
    storeId: number;
    token: string;
    permissions: Array<{ action: string; resource: string }>;
}

class AuthStoreUserService {
    async execute(data: AuthRequest): Promise<AuthResponse> {
        return await prismaClient.$transaction(async (tx) => {
            this.validateInput(data);

            const storeUser = await tx.storeUser.findFirst({
                where: {
                    storeId: data.storeId,
                    email: data.email,
                    isDeleted: false
                },
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            });

            if (!storeUser) throw new UnauthorizedError("Invalid credentials");
            
            const passwordValid = await compare(data.password, storeUser.password);
            if (!passwordValid) throw new UnauthorizedError("Invalid credentials");

            const token = sign(
                { sub: storeUser.id, storeId: storeUser.storeId, role: storeUser.roleId },
                process.env.JWT_SECRET!,
                { expiresIn: "8h" }
            );

            const permissions = storeUser.role?.rolePermissions.map(rp => ({
                action: rp.permission.action,
                resource: rp.permission.resource
            })) || [];

            await tx.auditLog.create({
                data: {
                    action: "STORE_USER_LOGIN",
                    details: JSON.stringify({
                        method: "email/password",
                        device: data.userAgent
                    }),
                    userId: storeUser.id,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent
                }
            });

            return {
                id: storeUser.id,
                name: storeUser.name,
                email: storeUser.email,
                roleId: storeUser.roleId,
                storeId: storeUser.storeId,
                token,
                permissions
            };
        });
    }

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    private validateInput({ storeId, email, password }: AuthRequest) {
        if (!storeId || isNaN(storeId)) throw new ValidationError("Invalid store ID");
        if (!this.isValidEmail(email)) throw new ValidationError("Invalid email format");
        if (password.length < 8) throw new ValidationError("Password must be at least 8 characters");
    }
}

export { AuthStoreUserService };