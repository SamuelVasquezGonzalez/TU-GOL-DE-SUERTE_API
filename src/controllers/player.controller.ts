import { Request, Response } from "express";
import { PlayerService } from "@/services/player.service";
import { ResponseError } from "@/utils/errors.util";

export class PlayerController {
    private player_service = new PlayerService();

    // ==================== GET ENDPOINTS ====================

    public get_all_players = async (req: Request, res: Response) => {
        try {
            const players = await this.player_service.get_all_players();
            
            res.status(200).json({
                success: true,
                message: "Jugadores obtenidos exitosamente",
                data: players
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener jugadores");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_player_by_id = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const player = await this.player_service.get_player_by_id({ id });
            
            res.status(200).json({
                success: true,
                message: "Jugador obtenido exitosamente",
                data: player
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener jugador");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_players_by_team = async (req: Request, res: Response) => {
        try {
            const { team_id } = req.params;
            const players = await this.player_service.get_players_by_team({ team_id });
            
            res.status(200).json({
                success: true,
                message: "Jugadores del equipo obtenidos exitosamente",
                data: players
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener jugadores del equipo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public search_players = async (req: Request, res: Response) => {
        try {
            const { name } = req.query;
            if (!name) throw new ResponseError(400, "Nombre del jugador requerido");
            
            const players = await this.player_service.get_players_by_name({ 
                name: name as string 
            });
            
            res.status(200).json({
                success: true,
                message: "Jugadores encontrados exitosamente",
                data: players
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al buscar jugadores");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== POST ENDPOINTS ====================

    public create_player = async (req: Request, res: Response) => {
        try {
            const { name, team_id } = req.body;
            
            if (!name || !team_id) {
                throw new ResponseError(400, "Nombre y equipo son requeridos");
            }
            
            const new_player = await this.player_service.create_new_player({
                name,
                team_id
            });
            
            res.status(201).json({
                success: true,
                message: "Jugador creado exitosamente",
                data: new_player
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al crear jugador");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== PUT ENDPOINTS ====================

    public update_player = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, team_id } = req.body;
            
            if (!name && !team_id) {
                throw new ResponseError(400, "Al menos el nombre o el equipo deben ser proporcionados");
            }
            
            const updated_player = await this.player_service.update_player({
                id,
                name,
                team_id
            });
            
            res.status(200).json({
                success: true,
                message: "Jugador actualizado exitosamente",
                data: updated_player
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al actualizar jugador");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== DELETE ENDPOINTS ====================

    public delete_player = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            await this.player_service.delete_player_by_id({ id });
            
            res.status(200).json({
                success: true,
                message: "Jugador eliminado exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al eliminar jugador");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public delete_players_by_team = async (req: Request, res: Response) => {
        try {
            const { team_id } = req.params;
            
            const result = await this.player_service.delete_players_by_team({ team_id });
            
            res.status(200).json({
                success: true,
                message: result.message,
                data: { deleted_count: result.deleted_count }
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al eliminar jugadores del equipo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }
}
