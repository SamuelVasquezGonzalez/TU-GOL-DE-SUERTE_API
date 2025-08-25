import cors, { CorsOptions } from "cors";
import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import { ALLOWED_METHODS, ALLOWED_ORIGINS } from "./shared/contants";

export const app: Application = express();

const corsOptions: CorsOptions = {
    origin: ALLOWED_ORIGINS,
    methods: ALLOWED_METHODS,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));


app.get("/", (req: Request, res: Response) => {
    res.json({
        name: "OBRA LABOR API",
        version: "1.0.0",
        access: "private",
        ok: true,
    });
});


app.use((req: Request, res: Response) => {
    res.status(404).json({ 
        message: "Route not found",
        path: req.path,
        method: req.method,
        requested: req.ip,
    });
});

