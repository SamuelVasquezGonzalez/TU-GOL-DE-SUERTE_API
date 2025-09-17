import { SoccerTeamModel } from "@/models/soccer_team.model";
import { ResponseError } from "@/utils/errors.util";
import { delete_image, upload_image } from "@/utils/cloudinary.util";

export class SoccerTeamsService {
    // methods

    // GET

    public async get_all_soccer_teams() {
        try {
            const soccer_teams = await SoccerTeamModel.find();
            if(!soccer_teams) throw new ResponseError(404, "No se encontraron equipos de futbol");
            return soccer_teams;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los equipos de futbol");
        }
    }

    public async get_soccer_team_by_id({id}: {id: string}) {
        try {

            const soccer_team = await SoccerTeamModel.findById(id).lean();
            if(!soccer_team) throw new ResponseError(404, "No se encontró el equipo de futbol");
            return soccer_team;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el equipo de futbol");
        }
    }

    public async get_soccer_team_by_name({name}: {name: string}) {
        try {
            const soccer_team = await SoccerTeamModel.findOne({name});
            if(!soccer_team) throw new ResponseError(404, "No se encontró el equipo de futbol");
            return soccer_team;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el equipo de futbol");
        }
    }   

    // POST

    public async create_new_soccer_team({name, avatar, color}: {name: string, avatar: Express.Multer.File, color: string}) {
        try {
            await this.verify_exist_name({name});
            const new_image = await upload_image({image: avatar});
            const soccer_team = await SoccerTeamModel.create({name, avatar: {url: new_image.url, public_id: new_image.public_id}, color, created: new Date()});
            if(!soccer_team) throw new ResponseError(400, "Error al crear el equipo de futbol");
            return soccer_team;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear el equipo de futbol");
        }
    }

    // PUT 

    public async update_soccer_team_by_id({id, name, avatar, color}: {id: string, name: string, avatar: Express.Multer.File, color: string}) {
        try {
            const soccer_team = await this.get_soccer_team_by_id({id});
            if(!soccer_team) throw new ResponseError(404, "No se encontró el equipo de futbol");

            if(name && name !== soccer_team.name) await this.verify_exist_name({name});

            if(avatar) {
                await delete_image({public_id: soccer_team.avatar.public_id});
            }
            const new_image = await upload_image({image: avatar});

            soccer_team.avatar = {
                url: new_image.url,
                public_id: new_image.public_id
            };
            soccer_team.color = color;
            soccer_team.name = name;

            await soccer_team.save();
        } catch (error) {
            if(error instanceof ResponseError) throw error;
            throw new ResponseError(500, "Error al actualizar el equipo de futbol");
            
        }
    }

    // DELETE 

    public async delete_soccer_team_by_id({id}: {id: string}) {
        try {
            const soccer_team = await this.get_soccer_team_by_id({id});
            if(!soccer_team) throw new ResponseError(404, "No se encontró el equipo de futbol");

            await delete_image({public_id: soccer_team.avatar.public_id});
            await soccer_team.deleteOne();
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al eliminar el equipo de futbol");
        }
    }
    

    private async verify_exist_name({name}: {name: string}) {
        try {
            const soccer_team = await SoccerTeamModel.findOne({name});
            if(soccer_team) throw new ResponseError(400, "El nombre del equipo de futbol ya existe");
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar el nombre del equipo de futbol");
        }
    }
}