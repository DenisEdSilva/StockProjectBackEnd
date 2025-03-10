import prismaClient from "../prisma";
import cron from "node-cron";

async function cleanDeletedDatasAndLogs() {
    try {
        const thirtyMinutesAgo = new Date();
        thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

        await prismaClient.stockMovimentStore.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyMinutesAgo,
                },
            },
        });

        await prismaClient.stockMoviment.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyMinutesAgo,
                },
            },
        });

        await prismaClient.product.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyMinutesAgo,
                },
            },
        });

        await prismaClient.category.deleteMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyMinutesAgo,
                },
            },
        });

        const deletedStores = await prismaClient.store.findMany({
            where: {
                isDeleted: true,
                deletedAt: {
                    lt: thirtyMinutesAgo,
                },
            },
        });

        for (const store of deletedStores) {
            await prismaClient.stockMovimentStore.deleteMany({
                where: { storeId: store.id },
            });

            await prismaClient.stockMoviment.deleteMany({
                where: { storeId: store.id },
            });

            await prismaClient.product.deleteMany({
                where: { storeId: store.id },
            });

            await prismaClient.category.deleteMany({
                where: { storeId: store.id },
            });

            await prismaClient.storeUser.deleteMany({
                where: { storeId: store.id },
            });

            await prismaClient.role.deleteMany({
                where: { storeId: store.id },
            });

            await prismaClient.store.delete({
                where: { id: store.id },
            });

            console.log(`Store ${store.name} and related data permanently deleted`);
        }

        await prismaClient.auditLog.deleteMany({});

        console.log("Old deleted data and audit logs cleaned successfully");
    } catch (error) {
        console.error("Error cleaning deleted data and logs:", error);
    }
}

cron.schedule("*/15 * * * *", () => {
    cleanDeletedDatasAndLogs();
});