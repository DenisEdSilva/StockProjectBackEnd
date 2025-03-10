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

        await prismaClient.auditLog.deleteMany({
            where: {
                createdAt: {
                    lt: thirtyMinutesAgo,
                },
            },
        });

        console.log("Non-critical deleted data and audit logs cleaned successfully");
    } catch (error) {
        console.error("Error cleaning deleted data and logs:", error);
    }
}

cron.schedule("*/15 * * * *", () => {
    cleanDeletedDatasAndLogs();
});