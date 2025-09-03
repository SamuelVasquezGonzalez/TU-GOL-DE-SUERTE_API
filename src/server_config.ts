import cors, { CorsOptions } from "cors";
import express, { Application, Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import morgan from "morgan";
import { ALLOWED_METHODS, ALLOWED_ORIGINS } from "./shared/contants";
import { register_all_game_events } from "./events/game_events";


const corsOptions: CorsOptions = {
    origin: ALLOWED_ORIGINS,
    methods: ALLOWED_METHODS,
    optionsSuccessStatus: 204,
};

const ioCorsOptions = {
    origin: ALLOWED_ORIGINS,
    methods: ALLOWED_METHODS,
    optionsSuccessStatus: 204,
};

export const app: Application = express();
const http_server = createServer(app);

export const io_server = new Server(http_server, {
    cors: ioCorsOptions,
    transports: ["websocket","polling"]
});

io_server.on("connection", (socket) => {
    register_all_game_events(socket);
});


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));


app.get("/", (req: Request, res: Response) => {
    res.json({
        name: "TU GOL DE SUERTE API",
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

