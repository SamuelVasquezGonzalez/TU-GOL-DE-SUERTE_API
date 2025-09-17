import { PlayerModel } from "@/models/player.model";
import { ResponseError } from "@/utils/errors.util";
import { SoccerTeamsService } from "./soccer_teams.service";

export class PlayerService {
    // methods

    // GET

 
    public async get_all_players() {
        try {
            const players = await PlayerModel.find();
            if (!players) throw new ResponseError(404, "No se encontraron jugadores");
            return players;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los jugadores");
        }
    }

    public async get_player_by_id({ id }: { id: string }) {
        try {
            const player = await PlayerModel.findById(id);
            if (!player) throw new ResponseError(404, "No se encontró el jugador");
            return player;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener el jugador");
        }
    }

  
    public async get_players_by_team({ team_id }: { team_id: string }) {
        try {
            const players = await PlayerModel.find({ team_id });
            if (!players || players.length === 0) {
                throw new ResponseError(404, "No se encontraron jugadores para este equipo");
            }
            return players;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener los jugadores del equipo");
        }
    }


    public async get_players_by_name({ name }: { name: string }) {
        try {
            const players = await PlayerModel.find({
                name: { $regex: name, $options: "i" }
            });
            if (!players || players.length === 0) {
                throw new ResponseError(404, "No se encontraron jugadores con ese nombre");
            }
            return players;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al buscar jugadores por nombre");
        }
    }

    // POST


    public async create_new_player({ name, team_id }: { name: string; team_id: string }) {
        try {
            await this.verify_team_exists({ team_id });
            await this.verify_player_name_unique_in_team({ name, team_id });

            const player = await PlayerModel.create({
                name,
                team_id,
                created_at: new Date()
            });

            if (!player) throw new ResponseError(400, "Error al crear el jugador");
            return player;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear el jugador");
        }
    }

    // PUT

    public async update_player({ id, name, team_id }: { id: string; name?: string; team_id?: string }) {
        try {
            const player = await this.get_player_by_id({ id });

            if (team_id) {
                await this.verify_team_exists({ team_id });
            }

            if (name && team_id) {
                // Si se actualizan ambos, verificar en el nuevo equipo
                await this.verify_player_name_unique_in_team({ 
                    name, 
                    team_id, 
                    exclude_player_id: id 
                });
            } else if (name) {
                // Si solo se actualiza el nombre, verificar en el equipo actual
                await this.verify_player_name_unique_in_team({ 
                    name, 
                    team_id: player.team_id, 
                    exclude_player_id: id 
                });
            } else if (team_id) {
                // Si solo se actualiza el equipo, verificar con el nombre actual
                await this.verify_player_name_unique_in_team({ 
                    name: player.name, 
                    team_id, 
                    exclude_player_id: id 
                });
            }

            if (name) player.name = name;
            if (team_id) player.team_id = team_id;
            
            await player.save();
            return player;
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al actualizar el jugador");
        }
    }

    // DELETE

    public async delete_player_by_id({ id }: { id: string }) {
        try {
            const player = await this.get_player_by_id({ id });
            await player.deleteOne();
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al eliminar el jugador");
        }
    }


    public async delete_players_by_team({ team_id }: { team_id: string }) {
        try {
            const result = await PlayerModel.deleteMany({ team_id });
            return {
                deleted_count: result.deletedCount,
                message: `Se eliminaron ${result.deletedCount} jugadores del equipo`
            };
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al eliminar los jugadores del equipo");
        }
    }

    // PRIVATE METHODS


    private async verify_team_exists({ team_id }: { team_id: string }) {
        try {
            const soccer_teams_service = new SoccerTeamsService();
            await soccer_teams_service.get_soccer_team_by_id({ id: team_id });
        } catch (err) {
            if (err instanceof ResponseError && err.statusCode === 404) {
                throw new ResponseError(404, "El equipo especificado no existe");
            }
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar la existencia del equipo");
        }
    }


    private async verify_player_name_unique_in_team({ 
        name, 
        team_id, 
        exclude_player_id 
    }: { 
        name: string; 
        team_id: string; 
        exclude_player_id?: string 
    }) {
        try {
            const query: any = { name: { $regex: `^${name}$`, $options: "i" }, team_id };
            
            if (exclude_player_id) {
                query._id = { $ne: exclude_player_id };
            }

            const existingPlayer = await PlayerModel.findOne(query);
            
            if (existingPlayer) {
                throw new ResponseError(400, "Ya existe un jugador con ese nombre en el equipo");
            }
        } catch (err) {
            if (err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al verificar la unicidad del nombre del jugador");
        }
    }
}
