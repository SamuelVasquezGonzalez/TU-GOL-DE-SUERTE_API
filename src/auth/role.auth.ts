import { NextFunction, Request, Response } from "express";
import { ResponseError } from "@/utils/errors.util";
import jwt from "jsonwebtoken";
import { GLOBAL_ENV } from "@/shared/contants";
import { RequestUser } from "@/contracts/types/global.type";
import { UserRole, UserTokenPayload } from "@/contracts/types/user.type";

/**
 * Middleware de autorización flexible.
 *
 * Permite el acceso si el rol del token está dentro de la lista de roles indicada.
 * Reemplaza el encadenamiento de middlewares por-rol (p.ej. `customer_auth, staff_auth`),
 * que era un bug: al encadenarlos, Express exige que se cumplan TODOS, y como un usuario
 * sólo puede tener un rol, esas rutas quedaban inaccesibles para todos.
 *
 * Uso:
 *   router.put("/profile", authorize("customer", "staff", "admin"), controller.method)
 *
 * Si no se pasa ningún rol, sólo exige un token válido (cualquier usuario autenticado).
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw_token = req.headers["authorization"];
      if (!raw_token) throw new ResponseError(401, "No se proporcionó un token");

      // Soportar tanto "Bearer <token>" como el token enviado a secas
      const token = raw_token.startsWith("Bearer ") ? raw_token.slice(7) : raw_token;

      const decoded = jwt.verify(token, GLOBAL_ENV.JWT_SECTRET) as UserTokenPayload;

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new ResponseError(403, "No tienes permisos para acceder a este recurso");
      }

      (req as RequestUser).user = decoded;
      next();
    } catch (error) {
      if (error instanceof ResponseError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(401).json({ success: false, message: "Token inválido o expirado" });
    }
  };
};
