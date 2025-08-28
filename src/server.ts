import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import "express-async-errors"
import cors from "cors";
import cookieParser from "cookie-parser";
import { router } from  "./routes";
import { errorHandler } from "./middlewares/errorHandler";

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

app.listen(3333, () => console.log("Server started on port 3333"));