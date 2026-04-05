import prismaClient from "../../prisma";
import { hash } from "bcryptjs";
import { ConflictError, ValidationError } from "../../errors";
import { CreateAuditLogService } from "../audit/CreateAuditLogService";

interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
}

class CreateUserService {
    constructor(private auditLogService: CreateAuditLogService) {}

    async execute(data: CreateUserRequest) {
        this.validateInput(data);

        return await prismaClient.$transaction(async (tx) => {
            const userAlreadyExists = await tx.user.findFirst({
                where: { email: data.email, isDeleted: false },
                select: { id: true }
            });

            if (userAlreadyExists) {
                throw new ConflictError("EmailAlreadyInUse");
            }

            const passwordHash = await hash(data.password, 10);

            const newUser = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: passwordHash,
                    isOwner: true,
                },
                select: { 
                    id: true, 
                    name: true, 
                    email: true, 
                    isOwner: true 
                }
            });

            await this.auditLogService.create({
                action: "USER_CREATED",
                userId: newUser.id,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                isOwner: true
            }, tx);

            return newUser;
        });
    }

    private validateInput(data: CreateUserRequest) {
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
            throw new ValidationError("InvalidName");
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            throw new ValidationError("InvalidEmail");
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!data.password || !passwordRegex.test(data.password)) {
            throw new ValidationError("InvalidPasswordRequirements");
        }
    }
}

export { CreateUserService };