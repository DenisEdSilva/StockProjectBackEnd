import prismaClient from "../../prisma";
import { Prisma } from "@prisma/client";

interface TrackActivityParams {
  tx?: Prisma.TransactionClient;
  storeId?: number;
  ownerId?: number;
  storeUserId?: number;
}

export class ActivityTracker {
  async track({ tx, storeId, ownerId, storeUserId }: TrackActivityParams) {
    const client = tx || prismaClient;
    const updates = [];

    if (storeId) {
      updates.push(
        client.store.update({
          where: { id: storeId },
          data: { lastActivityAt: new Date() }
        }).catch(() => {})
      );
    }

    if (ownerId) {
      updates.push(
        client.user.update({
          where: { id: ownerId },
          data: { lastActivityAt: new Date() }
        }).catch(() => {})
      );
    }

    if (storeUserId) {
      updates.push(
        client.storeUser.update({
          where: { id: storeUserId },
          data: { lastActivityAt: new Date() }
        }).catch(() => {})
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }
}