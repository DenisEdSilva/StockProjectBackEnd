import express from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { connectRedis } from "./redis.config";

const app = express();

app.use(express.json());

app.use(cors({
	origin: process.env.NODE_ENV === "production"
		? "https://seusite.com"
		: "http://localhost:3000",
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true
}));

app.use(cookieParser());
app.use(router);
app.use(errorHandler);

async function bootstrap() {
	try {
		await connectRedis();

		app.listen(3333, () => {
			console.log("Server started on port 3333");
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

bootstrap();