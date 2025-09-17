import { NextFunction, Request, Response } from "express";
import { ResponseError } from "@/utils/errors.util";
import jwt from "jsonwebtoken";
import { GLOBAL_ENV } from "@/shared/contants";
import { RequestUser } from "@/contracts/types/global.type";
import { UserTokenPayload } from "@/contracts/types/user.type";

export const admin_auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if(!token) throw new ResponseError(401, "No se proporcionó un token");
        const decoded = jwt.verify(token, GLOBAL_ENV.JWT_SECTRET) as UserTokenPayload;

        if(decoded.role !== "admin" && decoded.role !== "customer") throw new ResponseError(401, "El usuario no es un administrador");
        (req as RequestUser).user = decoded;
        next();
    } catch (error) {
        if(error instanceof ResponseError) throw error;
        throw new ResponseError(500, "Error al autenticar el administrador");
    }
}