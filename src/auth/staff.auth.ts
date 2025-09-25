import { NextFunction, Request, Response } from "express";
import { ResponseError } from "@/utils/errors.util";
import jwt from "jsonwebtoken";
import { GLOBAL_ENV } from "@/shared/contants";
import { RequestUser } from "@/contracts/types/global.type";
import { UserTokenPayload } from "@/contracts/types/user.type";

export const staff_auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers["authorization"];
        if(!token) throw new ResponseError(401, "No se proporcionó un token");
        const decoded = jwt.verify(token, GLOBAL_ENV.JWT_SECTRET) as UserTokenPayload;

        if(decoded.role !== "staff") throw new ResponseError(401, "El usuario no es un staff");
        (req as RequestUser).user = decoded;
        next();
    } catch (error) {
        if(error instanceof ResponseError) throw error;
        throw new ResponseError(500, "Error al autenticar el administrador");
    }
}