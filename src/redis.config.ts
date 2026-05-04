import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
    url: redisUrl
});

redisClient.on("error", (err) => {
    console.log("Redis Error ", err)
});

redisClient.on("connect", () => {
    console.log("Redis connected");
});

export async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

export { redisClient };