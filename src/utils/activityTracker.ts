import prismaClient from "../prisma"

export async function updateUserActivity(userId: number) {
    await prismaClient.user.update({
        where: { id: userId },
        data: { lastActivityAt: new Date() }
    })
}

export async function updateStoreActivity(storeId: number) {
    await prismaClient.store.update({
        where: { id: storeId },
        data: { lastActivityAt: new Date() }
    })
}