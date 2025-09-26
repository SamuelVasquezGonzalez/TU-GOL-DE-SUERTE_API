import bcrypt from "bcrypt";
import { UserPayload } from "@/contracts/interfaces/users.interface";
import { UserIdentity, UserRole, UserTokenPayload } from "@/contracts/types/user.type";
import { UserModel } from "@/models/user.model";
import { delete_image, upload_image } from "@/utils/cloudinary.util";
import { ResponseError } from "@/utils/errors.util";
import { generate_random_password, generate_recover_code, hash_password } from "@/utils/generate.util";
import { GLOBAL_ENV } from "@/shared/contants";
import jwt from "jsonwebtoken";
import { send_welcome_email, send_welcome_admin_email, send_welcome_staff_email, send_recovery_email } from "@/emails/email-main";

export class UserService {
    // methods

    // GET
    public async get_all_users({ type_user }: { type_user?: UserRole }) {
        try {
            const users = await UserModel.find(type_user ? { role: type_user } : {});
            if (!users) throw new ResponseError(404, "No se encontraron usuarios");
            return users;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los usuarios");
        }
    }

    public async get_user_by_id({ id }: { id: string }) {
        try {
            const user = await UserModel.findById(id);
            if (!user) throw new ResponseError(404, "No se encontró el usuario");
            return user;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el usuario");
        }
    }

    public async get_users_by_param({ param }: { param: string }) {
        try {
            // param puede ser name, email, phone o identity

            const users = await UserModel.find({
                $or: [{ name: { $regex: param, $options: "i" } }, { email: { $regex: param, $options: "i" } }, { phone: { $regex: param, $options: "i" } }, { identity: { $regex: param, $options: "i" } }],
            });
            if (!users) throw new ResponseError(404, "No se encontraron usuarios");
            return users;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los usuarios");
        }
    }
    // POST

    public async create_new_user({ name, email, identity, phone, role, password }: UserPayload) {
        try {
            if (!password && (role === "admin" || role === "staff")) throw new ResponseError(400, "La contraseña es requerida para administradores y staff");

            await this.verify_exist_email({ email });
            await this.verify_exist_phone({ phone });
            await this.verify_exist_identity({ identity });

            const recover_code = generate_recover_code({ length: 6 });
            const plane_password = (role === "admin" || role === "staff") ? generate_random_password({ length: 8 }) : password || "";
            const hashed_password = await hash_password(plane_password || "");


            await UserModel.create({
                name,
                email,
                identity,
                phone,
                role: !role ? "customer" : role,
                recover_code,
                password: hashed_password,
            });

            // Enviar correo de bienvenida según el rol
            if (role === "admin") {
                await send_welcome_admin_email({
                    admin_name: name,
                    admin_email: email,
                    temp_admin_pssw: plane_password
                });
            } else if (role === "staff") {
                await send_welcome_staff_email({
                    staff_name: name,
                    staff_email: email,
                    temp_staff_pssw: plane_password
                });
            } else {
                await send_welcome_email({
                    name: name,
                    email: email,
                    temp_pssw: plane_password
                });
            }
        } catch (err) {
            console.log(err);
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear el administrador");
        }
    }

    public async request_recover_password({ email, identity }: { email?: string; identity?: UserIdentity }) {
        try {
            if (!email && !identity) throw new ResponseError(400, "Se debe proporcionar un correo o una identificacion");

            const user = await UserModel.findOne({ $or: [{ email }, { identity }] });

            if (!user) throw new ResponseError(404, "Usuario no encontrado");

            const recover_code = user.recover_code;

            // Enviar correo de recuperación
            await send_recovery_email({
                user_name: user.name,
                user_email: user.email,
                recover_code: recover_code
            });
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al solicitar el codigo de recuperación");
        }
    }

    public async verify_recover_code({ email, identity, code }: { email?: string; identity?: UserIdentity; code: number }) {
        try {
            if (!email && !identity && !code) throw new ResponseError(400, "Se debe proporcionar un correo o una identificacion y un codigo de recuperación");

            const user = await UserModel.findOne({ $or: [{ email }, { identity }] });

            if (!user) throw new ResponseError(404, "Usuario no encontrado");
            if (user.recover_code !== code) throw new ResponseError(400, "Codigo de recuperación incorrecto");
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el codigo de recuperación");
        }
    }

    public async verify_successful_recover_password({ email, identity, code, new_password }: { email?: string; identity?: UserIdentity; code: number; new_password: string }) {
        try {
            if (!email && !identity && !code && !new_password) throw new ResponseError(400, "Se debe proporcionar un correo o una identificacion, un codigo de recuperación y una nueva contraseña");
            const user = await UserModel.findOne({ $or: [{ email }, { identity }] });
            if (!user) throw new ResponseError(404, "Usuario no encontrado");
            if (user.recover_code !== code) throw new ResponseError(400, "Codigo de recuperación incorrecto");

            user.password = await hash_password(new_password);
            user.recover_code = generate_recover_code({ length: 6 });
            await user.save();

            return user;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el codigo de recuperación");
        }
    }

    public async login_user({ email, password }: { email: string; password: string }) {
        try {
            if (!email || !password) throw new ResponseError(400, "Se debe proporcionar un correo y una contraseña");

            const user = await UserModel.findOne({ email });
            if (!user) throw new ResponseError(404, "Usuario no encontrado");

            const is_valid_password = await this.verify_hashed_password({ password, hashed_password: user.password });

            if (is_valid_password) {
                const access_token = await this.generate_access_token(
                    { payload: 
                        { 
                            _id: user.id, 
                            avatar: user.avatar || undefined, 
                            role: user.role 
                        } 
                    }
                );
                return {
                    access_token,
                };
            } else {
                throw new ResponseError(400, "Correo o contraseña incorrecto");
            }
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al iniciar sesión");
        }
    }

    // PUT

    public async update_user_profile({ user_id, payload, avatar }: { user_id: string; payload: UserPayload; avatar?: Express.Multer.File }) {
        try {
            const { name, email, identity, phone } = payload;

            const user = await this.get_user_by_id({ id: user_id });

            if (avatar) {
                const old_public_id = user.avatar?.public_id;
                if (old_public_id) {
                    await delete_image({ public_id: old_public_id });
                }
                const new_image = await upload_image({ image: avatar });
                user.avatar = {
                    url: new_image.url,
                    public_id: new_image.public_id,
                };
            }

            user.name = name;
            user.email = email;
            user.identity = identity;
            user.phone = phone;

            await user.save();
            return user;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar el perfil del usuario");
        }
    }

    public async change_password({ user_id, current_password, new_password }: { user_id: string; current_password: string; new_password: string }) {
        try {
            const user = await this.get_user_by_id({ id: user_id });

            // Verificar contraseña actual
            const is_valid_password = await this.verify_hashed_password({ 
                password: current_password, 
                hashed_password: user.password 
            });

            if (!is_valid_password) {
                throw new ResponseError(400, "La contraseña actual es incorrecta");
            }

            // Hashear nueva contraseña
            const hashed_new_password = await hash_password(new_password);
            user.password = hashed_new_password;
            
            // Generar nuevo código de recuperación por seguridad
            user.recover_code = generate_recover_code({ length: 6 });
            
            await user.save();
            return user;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al cambiar la contraseña");
        }
    }

    public async upload_profile_image({ user_id, image }: { user_id: string; image: Express.Multer.File }) {
        try {
            const user = await this.get_user_by_id({ id: user_id });

            // Eliminar imagen anterior si existe
            if (user.avatar?.public_id) {
                await delete_image({ public_id: user.avatar.public_id });
            }

            // Subir nueva imagen
            const new_image = await upload_image({ image });
            user.avatar = {
                url: new_image.url,
                public_id: new_image.public_id,
            };

            await user.save();
            return user;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al subir la imagen de perfil");
        }
    }

    public async delete_profile_image({ user_id }: { user_id: string }) {
        try {
            const user = await this.get_user_by_id({ id: user_id });

            if (!user.avatar?.public_id) {
                throw new ResponseError(404, "El usuario no tiene imagen de perfil");
            }

            // Eliminar imagen de Cloudinary
            await delete_image({ public_id: user.avatar.public_id });
            
            // Remover referencia de la base de datos
            delete user.avatar;
            await user.save();

            return user;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al eliminar la imagen de perfil");
        }
    }

    // DELETE

    public async delete_user({ user_id }: { user_id: string }) {
        try {
            const user = await this.get_user_by_id({ id: user_id });

            // Eliminar imagen de perfil si existe
            if (user.avatar?.public_id) {
                await delete_image({ public_id: user.avatar.public_id });
            }

            // Eliminar usuario de la base de datos
            await user.deleteOne();
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al eliminar el usuario");
        }
    }

    // private methods

    private async verify_exist_email({ email }: { email: string }) {
        try {
            const user = await UserModel.findOne({ email });

            if (user) {
                throw new ResponseError(400, "El correo ya pertenece a un usuario");
            }
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el correo");
        }
    }

    private async verify_exist_phone({ phone }: { phone: string }) {
        try {
            const user = await UserModel.findOne({ phone });
            if (user) {
                throw new ResponseError(400, "El telefono ya pertenece a un usuario");
            }
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el telefono");
        }
    }

    private async verify_exist_identity({ identity }: { identity: UserIdentity }) {
        try {
            const user = await UserModel.findOne({ identity });
            if (user) {
                throw new ResponseError(400, "La identidad ya pertenece a un usuario");
            }
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar la identidad");
        }
    }


    private async verify_hashed_password({ password, hashed_password }: { password: string; hashed_password: string }) {
        try {
            const is_valid = await bcrypt.compare(password, hashed_password);
            return is_valid;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar la contraseña");
        }
    }

    private async generate_access_token({ payload }: { payload: UserTokenPayload }) {
        try {
            const token = jwt.sign(payload, GLOBAL_ENV.JWT_SECTRET, { expiresIn: "7d" });
            return token;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al generar el token de acceso");
        }
    }
}
