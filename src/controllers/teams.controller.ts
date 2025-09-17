import { Request, Response } from "express";
import { SoccerTeamsService } from "@/services/soccer_teams.service";
import { ResponseError } from "@/utils/errors.util";

export class TeamsController {
    private teams_service = new SoccerTeamsService();

    // ==================== GET ENDPOINTS ====================

    public get_all_teams = async (req: Request, res: Response) => {
        try {
            const teams = await this.teams_service.get_all_soccer_teams();
            
            res.status(200).json({
                success: true,
                message: "Equipos obtenidos exitosamente",
                data: teams
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener equipos");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_team_by_id = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const team = await this.teams_service.get_soccer_team_by_id({ id });
            
            res.status(200).json({
                success: true,
                message: "Equipo obtenido exitosamente",
                data: team
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener equipo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public search_teams = async (req: Request, res: Response) => {
        try {
            const { name } = req.query;
            if (!name) throw new ResponseError(400, "Nombre del equipo requerido");
            
            const teams = await this.teams_service.get_soccer_team_by_name({ 
                name: name as string 
            });
            
            res.status(200).json({
                success: true,
                message: "Equipos encontrados exitosamente",
                data: teams
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al buscar equipos");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== POST ENDPOINTS ====================

    public create_team = async (req: Request, res: Response) => {
        try {
            const { name, color } = req.body;
            const avatar_file = req.file;
            
            if (!name || !color) {
                throw new ResponseError(400, "Nombre y color son requeridos");
            }
            
            if (!avatar_file) {
                throw new ResponseError(400, "Imagen del equipo es requerida");
            }
            
            const new_team = await this.teams_service.create_new_soccer_team({
                name,
                avatar: avatar_file as Express.Multer.File,
                color: color as string
            });
            
            res.status(201).json({
                success: true,
                message: "Equipo creado exitosamente",
                data: new_team
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al crear equipo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== PUT ENDPOINTS ====================

    public update_team = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const update_data = req.body;
            const avatar_file = req.file;
            
            const updated_team = await this.teams_service.update_soccer_team_by_id({
                id,
                name: update_data.name,
                avatar: avatar_file as Express.Multer.File,
                color: update_data.color
            });
            
            res.status(200).json({
                success: true,
                message: "Equipo actualizado exitosamente",
                data: updated_team
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al actualizar equipo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }


    // ==================== DELETE ENDPOINTS ====================

    public delete_team = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            await this.teams_service.delete_soccer_team_by_id({ id });
            
            res.status(200).json({
                success: true,
                message: "Equipo eliminado exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al eliminar equipo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

}
