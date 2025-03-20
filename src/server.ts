import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import "express-async-errors"
import cors from "cors";
import { router } from  "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // URL do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(router);

app.use(errorHandler);

app.listen(3333, () => console.log("Server started on port 3333"));