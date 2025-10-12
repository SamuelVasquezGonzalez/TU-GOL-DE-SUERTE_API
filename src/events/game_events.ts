import { io_server } from "@/server_config";
import { SoccerGameService } from "@/services/soccer_game.service";
import { TicketService } from "@/services/ticket.service";
import { ResponseError } from "@/utils/errors.util";
import { CurvaEntity, SoccerGameStatus } from "@/contracts/types/soccer_games.type";
import { Socket } from "socket.io";

export const GAME_EVENTS = {
    GET_GAMES: "games:get_all",
    UPDATE_SCORE: "games:update_score", 
    CREATE_TICKET: "games:create_ticket",
    UPDATE_CURVA: "games:update_curva",
    END_GAME: "games:end_game",
    CLOSE_CURVA: "games:close_curva",
    
    GAMES_FETCHED: "games:fetched_success",
    SCORE_UPDATED: "games:score_updated_success",
    TICKET_CREATED: "games:ticket_created_success",
    CURVA_UPDATED: "games:curva_updated_success",
    GAME_ENDED: "games:ended_success",
    CURVA_CLOSED: "games:curva_closed_success",

    GAME_STATUS_UPDATED: "games:status_updated_success",
    GAME_STATUS_TIME_BROADCAST: "games:status_changed_teams",
    
    SCORE_BROADCAST: "games:score_changed",
    TICKET_BROADCAST: "games:ticket_sold",
    CURVA_BROADCAST: "games:curva_changed", 
    GAME_STATUS_BROADCAST: "games:status_changed",
    GAME_END_BROADCAST: "games:game_finished",
    
    ERROR: "games:error"
} as const;


const get_games_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.GET_GAMES, async () => {
        try {
            const game_service = new SoccerGameService();
            const games = await game_service.get_all_soccer_games();
            
            // Respuesta al cliente específico
            socket.emit(GAME_EVENTS.GAMES_FETCHED, {
                success: true,
                data: games,
                message: "Partidos obtenidos exitosamente"
            });
        } catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al obtener los partidos de futbol";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.GET_GAMES
            });
        }
    });
}

const update_game_score_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.UPDATE_SCORE, async (data: {
        game_id: string, 
        score: [number, number]
    }) => {
        try {
            const { game_id, score } = data;
            const game_service = new SoccerGameService();
            await game_service.update_soccer_game_score({game_id, score});
            
            // Respuesta al cliente específico
            socket.emit(GAME_EVENTS.SCORE_UPDATED, {
                success: true,
                data: { game_id, score },
                message: "Marcador actualizado exitosamente"
            });
            
            // Broadcast a todos los clientes conectados
            io_server.emit(GAME_EVENTS.SCORE_BROADCAST, {
                game_id,
                score,
                timestamp: new Date()
            });
        } catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al actualizar el marcador del partido";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.UPDATE_SCORE
            });
        }
    });
}

const update_game_status_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.GAME_STATUS_UPDATED, async (data: {
        game_id: string,
        status: SoccerGameStatus
    }) => {
        try {
            const { game_id, status } = data;
            const game_service = new SoccerGameService();
            await game_service.update_game_status({game_id, status});

            socket.emit(GAME_EVENTS.GAME_STATUS_TIME_BROADCAST, {
                success: true,
                data: { game_id, status },
                message: "Estado del partido actualizado exitosamente"
            });

            io_server.emit(GAME_EVENTS.GAME_STATUS_TIME_BROADCAST, {
                game_id,
                status,
                timestamp: new Date()
            });
        }
        catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al actualizar el estado del partido";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.GAME_STATUS_UPDATED
            });
        }
    });
}

const create_ticket_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.CREATE_TICKET, async (data: {
        game_id: string,
        customer_id?: string,
        curva_id: string,
        quantity: number,
        user?: {
            name: string,
            email: string,
        }
    }) => {
        try {
            const { game_id, customer_id, curva_id, quantity, user } = data;
            const ticket_service = new TicketService();
            const new_ticket = await ticket_service.create_new_ticket({
                game_id, 
                customer_id, 
                curva_id, 
                quantity, 
                user
            });
            
            // Respuesta al cliente específico
            socket.emit(GAME_EVENTS.TICKET_CREATED, {
                success: true,
                data: new_ticket,
                message: "Ticket creado exitosamente"
            });
            
            // Broadcast a todos los clientes sobre la venta
            io_server.emit(GAME_EVENTS.TICKET_BROADCAST, {
                game_id,
                curva_id,
                quantity,
                timestamp: new Date()
            });
        } catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al crear el ticket";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.CREATE_TICKET
            });
        }
    });
}

const update_curva_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.UPDATE_CURVA, async (data: {
        game_id: string,
        curva_id: string,
        curva_updated: CurvaEntity
    }) => {
        try {
            const { game_id, curva_id, curva_updated } = data;
            const game_service = new SoccerGameService();
            await game_service.update_curva_results({game_id, curva_id, curva_updated});
            
            // Respuesta al cliente específico
            socket.emit(GAME_EVENTS.CURVA_UPDATED, {
                success: true,
                data: { game_id, curva_id, curva_updated },
                message: "Curva actualizada exitosamente"
            });
            
            // Broadcast a todos los clientes sobre el cambio de curva
            io_server.emit(GAME_EVENTS.CURVA_BROADCAST, {
                game_id,
                curva_id,
                curva_updated,
                timestamp: new Date()
            });
        } catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al actualizar la curva";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.UPDATE_CURVA
            });
        }
    });
}

const close_curva_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.CLOSE_CURVA, async (data: {
        game_id: string,
        curva_id: string
    }) => {
        try {
            const { game_id, curva_id } = data;
            const game_service = new SoccerGameService();
            await game_service.close_curva({game_id, curva_id});
            
            // Respuesta al cliente específico
            socket.emit(GAME_EVENTS.CURVA_CLOSED, {
                success: true,
                data: { game_id, curva_id },
                message: "Curva cerrada exitosamente"
            });
            
            // Broadcast a todos los clientes sobre el cierre de curva
            io_server.emit(GAME_EVENTS.CURVA_BROADCAST, {
                game_id,
                curva_id,
                status: "closed",
                timestamp: new Date()
            });
        } catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al cerrar la curva";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.CLOSE_CURVA
            });
        }
    });
}

const end_game_event = (socket: Socket) => {
    socket.on(GAME_EVENTS.END_GAME, async (data: {
        game_id: string
    }) => {
        try {
            const { game_id } = data;
            const game_service = new SoccerGameService();
            await game_service.end_soccer_game({game_id});
            
            // Respuesta al cliente específico
            socket.emit(GAME_EVENTS.GAME_ENDED, {
                success: true,
                data: { game_id },
                message: "Partido finalizado exitosamente"
            });
            
            // Broadcast a todos los clientes sobre el fin del juego
            io_server.emit(GAME_EVENTS.GAME_END_BROADCAST, {
                game_id,
                status: "finished",
                timestamp: new Date()
            });
            
            // También notificar cambio de estado general
            io_server.emit(GAME_EVENTS.GAME_STATUS_TIME_BROADCAST, {
                game_id,
                status: "finished",
                message: "El partido ha finalizado y se han determinado los ganadores",
                timestamp: new Date()
            });
        } catch (err) {
            const error_message = err instanceof ResponseError ? err.message : "Error al finalizar el partido";
            socket.emit(GAME_EVENTS.ERROR, {
                success: false,
                error: error_message,
                event: GAME_EVENTS.END_GAME
            });
        }
    });
}

// FUNCION MAIN DE REGISTRO DE EVENTOS

export const register_all_game_events = (socket: Socket) => {
    // Eventos existentes
    get_games_event(socket);
    update_game_score_event(socket);
    create_ticket_event(socket);
    
    // Nuevos eventos
    update_curva_event(socket);
    close_curva_event(socket);
    end_game_event(socket);
    update_game_status_event(socket);
}

