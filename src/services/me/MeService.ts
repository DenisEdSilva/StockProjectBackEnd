// src/services/core/MeService.ts
import prismaClient from "../../prisma";
import { NotFoundError } from "../../errors";

interface MeResponse {
  type: 'owner' | 'store';
  id: number;
  name: string;
  email: string;
  storeId?: number;
  permissions?: Array<{ action: string; resource: string }>;
}

class MeService {
  async execute(user: { id: number; type: 'owner' | 'store'; storeId?: number }): Promise<MeResponse> {
    try {
      if (user.type === 'owner') {
        return await this.getOwnerData(user.id);
      }
      return await this.getStoreUserData(user.id, user.storeId!);
    } catch (error) {
      throw new NotFoundError("Usuário não encontrado");
    }
  }

  private async getOwnerData(userId: number): Promise<MeResponse> {
    const owner = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        ownedStores: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!owner) throw new NotFoundError("Proprietário não encontrado");

    return {
      type: 'owner',
      id: owner.id,
      name: owner.name,
      email: owner.email
    };
  }

  private async getStoreUserData(userId: number, storeId: number): Promise<MeResponse> {
    const storeUser = await prismaClient.storeUser.findUnique({
      where: {
          id: userId,
          storeId: storeId,
          isDeleted: false
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!storeUser) throw new NotFoundError("Usuário da loja não encontrado");

    return {
      type: 'store',
      id: storeUser.id,
      name: storeUser.name,
      email: storeUser.email,
      storeId: storeUser.storeId,
      permissions: storeUser.role.permissions.map(p => ({
        action: p.permission.action,
        resource: p.permission.resource
      }))
    };
  }
}

export { MeService };