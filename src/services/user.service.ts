import { UserPayload } from "@/contracts/interfaces/users.interface";
import { UserIdentity, UserRole } from "@/contracts/types/user.type";
import { UserModel } from "@/models/user.model";
import { delete_image, upload_image } from "@/utils/cloudinary.util";
import { ResponseError } from "@/utils/errors.util";
import { generate_random_password, generate_recover_code, hash_password } from "@/utils/generate.util";

export class UserService {
    // methods

    // GET
    public async get_all_users({type_user}: {type_user?: UserRole}) {
        try {
            const users = await UserModel.find(type_user ? {role: type_user} : {});
            if(!users) throw new ResponseError(404, "No se encontraron usuarios");
            return users;
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los usuarios");
        }
    }

    public async get_user_by_id({id}: {id: string}) {
        try {
            const user = await UserModel.findById(id);
            if(!user) throw new ResponseError(404, "No se encontró el usuario");
            return user;
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el usuario");
        }
    }

    public async get_users_by_param({param}: {param: string}) {
        try {

            // param puede ser name, email, phone o identity
            
            const users = await UserModel.find({
                $or: [{name: {$regex: param, $options: "i"}}, 
                    {email: {$regex: param, $options: "i"}}, 
                    {phone: {$regex: param, $options: "i"}}, 
                    {identity: {$regex: param, $options: "i"}}]
            });
            if(!users) throw new ResponseError(404, "No se encontraron usuarios");
            return users;
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los usuarios");
        }
    }
    // POST

    public async create_new_user({
        name,
        email,
        identity,
        phone,
        role,
        pin
    }: UserPayload) {
        try {
            await this.verify_exist_email({email});
            await this.verify_exist_phone({phone});
            await this.verify_exist_identity({identity});

            const recover_code = generate_recover_code({length: 6});
            const plane_password = generate_random_password({length: 8});
            const hashed_password = await hash_password(plane_password);

            let pin_generated = generate_recover_code({length: 6});
            let result_pin = await this.verify_exist_pin({pin: pin_generated});

            // Seguir generando PINs hasta encontrar uno que no esté en uso
            while(result_pin.exist) {
                pin_generated = generate_recover_code({length: 6});
                result_pin = await this.verify_exist_pin({pin: pin_generated});
            }

            await UserModel.create({
                name,
                email,
                identity,
                phone,
                role,
                recover_code,
                password: hashed_password,
                pin: pin ? pin_generated : null
            })

            // * TODO: Enviar correo de bienvenida
            
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear el administrador");
        }
    }

    public async request_recover_password({email, identity}: {email?: string, identity?: UserIdentity}) {
        try {

            if(!email && !identity) throw new ResponseError(400, "Se debe proporcionar un correo o una identificacion");
            

            const user = await UserModel.findOne({$or: [{email}, {identity}]});

            if(!user) throw new ResponseError(404, "Usuario no encontrado");

            const recover_code = user.recover_code;
            console.log(recover_code);

            // * TODO: Enviar correo de recuperación => recover_code

        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al solicitar el codigo de recuperación");
        }
    }

    public async verify_recover_code({email, identity, code}: {email?: string, identity?: UserIdentity, code: number}) {
        try {
            if(!email && !identity && !code) throw new ResponseError(400, "Se debe proporcionar un correo o una identificacion y un codigo de recuperación");

            const user = await UserModel.findOne({$or: [{email}, {identity}]});

            if(!user) throw new ResponseError(404, "Usuario no encontrado");
            if(user.recover_code !== code) throw new ResponseError(400, "Codigo de recuperación incorrecto");

        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el codigo de recuperación");
        }
    }

    public async verify_successful_recover_password({email, identity, code, new_password}: {email?: string, identity?: UserIdentity, code: number, new_password: string}) {
        try {
            if(!email && !identity && !code && !new_password) throw new ResponseError(400, "Se debe proporcionar un correo o una identificacion, un codigo de recuperación y una nueva contraseña");
            const user = await UserModel.findOne({$or: [{email}, {identity}]});
            if(!user) throw new ResponseError(404, "Usuario no encontrado");
            if(user.recover_code !== code) throw new ResponseError(400, "Codigo de recuperación incorrecto");
            

            user.password = await hash_password(new_password);
            user.recover_code = generate_recover_code({length: 6});
            await user.save();

            return user;

            // * TODO: Enviar correo de recuperación => recover_code
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el codigo de recuperación");
        }
    }

    // PUT

    public async update_user_profile({user_id, payload, avatar}: {user_id: string, payload: UserPayload, avatar?: Express.Multer.File}) {
        try {
            const { name, email, identity, phone } = payload;
            
            const user = await this.get_user_by_id({id: user_id});

            if(avatar) {
                const old_public_id = user.avatar?.public_id;
                if(old_public_id) {
                    await delete_image({public_id: old_public_id});
                }
                const new_image = await upload_image({image: avatar});
                user.avatar = {
                    url: new_image.url,
                    public_id: new_image.public_id
                };
            }

            user.name = name;
            user.email = email;
            user.identity = identity;
            user.phone = phone;

            if(!user) throw new ResponseError(404, "Usuario no encontrado");
            
            
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar el perfil del usuario");
        }
    }

    

    
    
    
    
    // private methods


    private async verify_exist_email({email}: {email: string}) {  
        try {
            const user = await UserModel.findOne({email});
            
            if(user) {
                throw new ResponseError(400, "El correo ya pertenece a un usuario");
            }

        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el correo");
        }
    }

    private async verify_exist_phone({phone}: {phone: string}) {
        try {
            const user = await UserModel.findOne({phone});
            if(user) {
                throw new ResponseError(400, "El telefono ya pertenece a un usuario");
            }
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el telefono");
        }
    }

    private async verify_exist_identity({identity}: {identity: UserIdentity}) {
        try {
            const user = await UserModel.findOne({identity});
            if(user) {
                throw new ResponseError(400, "La identidad ya pertenece a un usuario");
            }
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar la identidad");
        }
    }

    private async verify_exist_pin({pin}: {pin: number}) {
        try {
            const user = await UserModel.findOne({pin});
            if(user) {
                return {
                    exist: true,
                }
            } else {
                return {
                    exist: false,
                }
            }
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el pin");
        }
    }
}