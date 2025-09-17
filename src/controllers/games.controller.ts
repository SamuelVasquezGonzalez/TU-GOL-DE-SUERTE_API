import { Request, Response } from "express";
import { SoccerGameService } from "@/services/soccer_game.service";
import { ResponseError } from "@/utils/errors.util";
import { SoccerGameStatus, CurvaEntity } from "@/contracts/types/soccer_games.type";

export class GamesController {
    private games_service = new SoccerGameService();

    // ==================== GET ENDPOINTS ====================

    public get_all_games = async (req: Request, res: Response) => {
        try {
            const games = await this.games_service.get_all_soccer_games();
            
            res.status(200).json({
                success: true,
                message: "Partidos obtenidos exitosamente",
                data: games
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener partidos");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_game_by_id = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const game = await this.games_service.get_soccer_game_by_id({ id });
            
            res.status(200).json({
                success: true,
                message: "Partido obtenido exitosamente",
                data: game
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener partido");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_game_by_tournament = async (req: Request, res: Response) => {
        try {
            const { tournament } = req.params;
            const game = await this.games_service.get_soccer_game_by_tournament({ tournament });
            
            res.status(200).json({
                success: true,
                message: "Partido del torneo obtenido exitosamente",
                data: game
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener partido del torneo");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_game_by_date = async (req: Request, res: Response) => {
        try {
            const { date } = req.query;
            if (!date) throw new ResponseError(400, "Fecha es requerida");
            
            const game = await this.games_service.get_soccer_game_by_date({ 
                date: new Date(date as string) 
            });
            
            res.status(200).json({
                success: true,
                message: "Partido de la fecha obtenido exitosamente",
                data: game
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener partido por fecha");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public get_curva_by_id = async (req: Request, res: Response) => {
        try {
            const { game_id, curva_id } = req.params;
            const { include_game } = req.query;
            
            const curva = await this.games_service.get_curva_by_id({
                id: curva_id,
                game_id,
                include_game: include_game === 'true'
            });
            
            res.status(200).json({
                success: true,
                message: "Curva obtenida exitosamente",
                data: curva
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al obtener curva");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== POST ENDPOINTS ====================

    public create_game = async (req: Request, res: Response) => {
        try {
            const { soccer_teams, start_date, end_time, status, tournament } = req.body;
            
            if (!soccer_teams || !start_date || !end_time || !status || !tournament) {
                throw new ResponseError(400, "Todos los campos son requeridos");
            }
            
            if (!Array.isArray(soccer_teams) || soccer_teams.length !== 2) {
                throw new ResponseError(400, "Se requieren exactamente 2 equipos");
            }
            
            const new_game = await this.games_service.create_new_soccer_game({
                soccer_teams: soccer_teams as [string, string],
                start_date: new Date(start_date),
                end_time: new Date(end_time),
                status: status as SoccerGameStatus,
                tournament
            });
            
            res.status(201).json({
                success: true,
                message: "Partido creado exitosamente",
                data: new_game
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al crear partido");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public open_new_curva = async (req: Request, res: Response) => {
        try {
            const { game_id } = req.params;
            
            const result = await this.games_service.open_new_curva({ game_id });
            
            res.status(201).json({
                success: true,
                message: "Nueva curva abierta exitosamente",
                data: result
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al abrir nueva curva");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    // ==================== PUT ENDPOINTS ====================

    public update_game_score = async (req: Request, res: Response) => {
        try {
            const { game_id } = req.params;
            const { score } = req.body;
            
            if (!score || !Array.isArray(score) || score.length !== 2) {
                throw new ResponseError(400, "Marcador válido es requerido [local, visitante]");
            }
            
            await this.games_service.update_soccer_game_score({
                game_id,
                score: score as [number, number]
            });
            
            res.status(200).json({
                success: true,
                message: "Marcador actualizado exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al actualizar marcador");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public update_curva_results = async (req: Request, res: Response) => {
        try {
            const { game_id, curva_id } = req.params;
            const { curva_updated } = req.body;
            
            if (!curva_updated) {
                throw new ResponseError(400, "Datos de curva actualizada son requeridos");
            }
            
            await this.games_service.update_curva_results({
                game_id,
                curva_id,
                curva_updated: curva_updated as CurvaEntity
            });
            
            res.status(200).json({
                success: true,
                message: "Resultados de curva actualizados exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al actualizar curva");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public close_curva = async (req: Request, res: Response) => {
        try {
            const { game_id, curva_id } = req.params;
            
            await this.games_service.close_curva({ game_id, curva_id });
            
            res.status(200).json({
                success: true,
                message: "Curva cerrada exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al cerrar curva");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    public end_game = async (req: Request, res: Response) => {
        try {
            const { game_id } = req.params;
            
            await this.games_service.end_soccer_game({ game_id });
            
            res.status(200).json({
                success: true,
                message: "Partido finalizado exitosamente"
            });
        } catch (err) {
            const error = err instanceof ResponseError ? err : new ResponseError(500, "Error al finalizar partido");
            res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

}
