import { Prisma } from "@prisma/client";

interface TrackActivityParams {
  tx: Prisma.TransactionClient;
  storeId?: number;
  performedByUserId?: number;
}

class ActivityTracker {
  async track({ tx, storeId, performedByUserId }: TrackActivityParams) {
    const updates = [];

    if (storeId) {
      updates.push(
        tx.store.update({
          where: { id: storeId },
          data: { lastActivityAt: new Date() }
        })
      );
    }

    if (performedByUserId && storeId) {
      const store = await tx.store.findUnique({
        where: { id: storeId },
        select: { ownerId: true }
      });

      if (store?.ownerId === performedByUserId) {
        updates.push(
          tx.user.update({
            where: { id: performedByUserId },
            data: { lastActivityAt: new Date() }
          })
        );
      }
    }

    if (performedByUserId && !storeId) {
      updates.push(
        tx.user.update({
          where: { id: performedByUserId },
          data: { lastActivityAt: new Date() }
        })
      );
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }
}

export { ActivityTracker };