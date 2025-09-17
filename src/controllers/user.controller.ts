import { Request, Response } from "express";
import { UserService } from "@/services/user.service";
import { ResponseError } from "@/utils/errors.util";
import { RequestUser } from "@/contracts/types/global.type";
import { UserRole } from "@/contracts/types/user.type";

export class UserController {
    private user_service = new UserService();

    // ==================== GET ENDPOINTS ====================

    public get_all_users = async (req: Request, res: Response) => {
        try {
            const { type_user } = req.query;
            const users = await this.user_service.get_all_users({ 
                type_user: type_user as UserRole 
            });
            
            res.status(200).json({
                success: true,
                message: "Usuarios obtenidos exitosamente",
                data: users
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener usuarios");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_user_by_id = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = await this.user_service.get_user_by_id({ id });
            
            res.status(200).json({
                success: true,
                message: "Usuario obtenido exitosamente",
                data: user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener usuario");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public search_users = async (req: Request, res: Response) => {
        try {
            const { param } = req.query;
            if (!param) throw new ResponseError(400, "Parámetro de búsqueda requerido");
            
            const users = await this.user_service.get_users_by_param({ 
                param: param as string 
            });
            
            res.status(200).json({
                success: true,
                message: "Usuarios encontrados exitosamente",
                data: users
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al buscar usuarios");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_user_profile = async (req: Request, res: Response) => {
        try {
            const user_id = (req as RequestUser).user._id;
            const user = await this.user_service.get_user_by_id({ id: user_id });
            
            res.status(200).json({
                success: true,
                message: "Perfil obtenido exitosamente",
                data: user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener perfil");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== POST ENDPOINTS ====================

    public create_user = async (req: Request, res: Response) => {
        try {
            const user_data = req.body;
            const new_user = await this.user_service.create_new_user(user_data);
            
            res.status(201).json({
                success: true,
                message: "Usuario creado exitosamente",
                data: new_user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al crear usuario");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public login_user = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw new ResponseError(400, "Email y contraseña son requeridos");
            }
            
            const login_result = await this.user_service.login_user({ email, password });
            
            res.status(200).json({
                success: true,
                message: "Login exitoso",
                data: login_result
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al iniciar sesión");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public forgot_password = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            if (!email) throw new ResponseError(400, "Email es requerido");
            
            await this.user_service.request_recover_password({ email });
            
            res.status(200).json({
                success: true,
                message: "Código de recuperación enviado"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al enviar código");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public verify_recovery_code = async (req: Request, res: Response) => {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                throw new ResponseError(400, "Email y código son requeridos");
            }
            
            const result = await this.user_service.verify_recover_code({ email, code: parseInt(code) });
            
            res.status(200).json({
                success: true,
                message: "Código verificado exitosamente",
                data: result
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al verificar código");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== PUT ENDPOINTS ====================

    public update_user_profile = async (req: Request, res: Response) => {
        try {
            const user_id = (req as RequestUser).user._id;
            const update_data = req.body;
            const image_file = req.file;
            
            const updated_user = await this.user_service.update_user_profile({
                user_id: user_id,
                payload: update_data,
                avatar: image_file
            });
            
            res.status(200).json({
                success: true,
                message: "Perfil actualizado exitosamente",
                data: updated_user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al actualizar perfil");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public change_password = async (req: Request, res: Response) => {
        try {
            const user_id = (req as RequestUser).user._id;
            const { current_password, new_password } = req.body;
            
            if (!current_password || !new_password) {
                throw new ResponseError(400, "Contraseña actual y nueva contraseña son requeridas");
            }
            
            const updated_user = await this.user_service.change_password({
                user_id,
                current_password,
                new_password
            });
            
            res.status(200).json({
                success: true,
                message: "Contraseña cambiada exitosamente",
                data: updated_user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al cambiar contraseña");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public reset_password = async (req: Request, res: Response) => {
        try {
            const { email, identity, code, new_password } = req.body;
            
            if ((!email && !identity) || !code || !new_password) {
                throw new ResponseError(400, "Email o identificación, código y nueva contraseña son requeridos");
            }
            
            const updated_user = await this.user_service.verify_successful_recover_password({
                email,
                identity,
                code: parseInt(code),
                new_password
            });
            
            res.status(200).json({
                success: true,
                message: "Contraseña restablecida exitosamente",
                data: updated_user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al restablecer contraseña");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public upload_profile_image = async (req: Request, res: Response) => {
        try {
            const user_id = (req as RequestUser).user._id;
            const image_file = req.file;
            
            if (!image_file) throw new ResponseError(400, "Imagen es requerida");
            
            const updated_user = await this.user_service.upload_profile_image({
                user_id,
                image: image_file
            });
            
            res.status(200).json({
                success: true,
                message: "Imagen de perfil subida exitosamente",
                data: updated_user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al subir imagen");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== DELETE ENDPOINTS ====================

    public delete_user = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            await this.user_service.delete_user({ user_id: id });
            
            res.status(200).json({
                success: true,
                message: "Usuario eliminado exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al eliminar usuario");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public delete_profile_image = async (req: Request, res: Response) => {
        try {
            const user_id = (req as RequestUser).user._id;
            
            const updated_user = await this.user_service.delete_profile_image({ user_id });
            
            res.status(200).json({
                success: true,
                message: "Imagen de perfil eliminada exitosamente",
                data: updated_user
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al eliminar imagen");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }
}
