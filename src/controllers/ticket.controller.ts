import { Request, Response } from "express";
import { TicketService } from "@/services/ticket.service";
import { ResponseError } from "@/utils/errors.util";
import { RequestUser } from "@/contracts/types/global.type";
import { TicketStatus } from "@/contracts/types/ticket.type";

export class TicketController {
    private ticket_service = new TicketService();

    // ==================== GET ENDPOINTS ====================

    public get_ticket_by_id = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const ticket = await this.ticket_service.get_ticket_by_id({ id });

            res.status(200).json({
                success: true,
                message: "Ticket obtenido exitosamente",
                data: ticket,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    public get_tickets_by_user = async (req: Request, res: Response) => {
        try {
            const { user_id } = req.params;
            const tickets = await this.ticket_service.get_tickets_by_user_id({ user_id });

            res.status(200).json({
                success: true,
                message: "Tickets del usuario obtenidos exitosamente",
                data: tickets,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    public get_my_tickets = async (req: Request, res: Response) => {
        try {
            const user_id = (req as RequestUser).user._id;
            const tickets = await this.ticket_service.get_tickets_by_user_id({ user_id });

            res.status(200).json({
                success: true,
                message: "Mis tickets obtenidos exitosamente",
                data: tickets,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    public get_tickets_by_game = async (req: Request, res: Response) => {
        try {
            const { game_id } = req.params;
            const tickets = await this.ticket_service.get_tickets_by_game_id({ game_id });

            res.status(200).json({
                success: true,
                message: "Tickets del juego obtenidos exitosamente",
                data: tickets,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    public get_tickets_by_curva = async (req: Request, res: Response) => {
        try {
            const { curva_id } = req.params;
            const tickets = await this.ticket_service.get_tickets_by_curva_id({ curva_id });

            res.status(200).json({
                success: true,
                message: "Tickets de la curva obtenidos exitosamente",
                data: tickets,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    public get_all_tickets = async (req: Request, res: Response) => {
        try {
            const tickets = await this.ticket_service.get_all_tickets();

            res.status(200).json({
                success: true,
                message: "Todos los tickets obtenidos exitosamente",
                data: tickets,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    // ==================== POST ENDPOINTS ====================

    public create_ticket = async (req: Request, res: Response) => {
        try {
            const { game_id, curva_id, quantity, ticket_price } = req.body;
            const customer_id = (req as RequestUser).user._id;

            if (!game_id || !curva_id || !quantity || !ticket_price) {
                throw new ResponseError(400, "Todos los campos son requeridos");
            }

            const new_ticket = await this.ticket_service.create_new_ticket({
                game_id,
                customer_id,
                curva_id,
                quantity,
                ticket_price,
            });

            res.status(201).json({
                success: true,
                message: "Ticket creado exitosamente",
                data: new_ticket,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    public create_ticket_admin = async (req: Request, res: Response) => {
        try {
            const { game_id, customer_id, curva_id, quantity, ticket_price, user } = req.body;

            if (!game_id || (!customer_id && !user) || !curva_id || !quantity || !ticket_price) {
                throw new ResponseError(400, "Todos los campos son requeridos");
            }

            const new_ticket = await this.ticket_service.create_new_ticket({
                game_id,
                customer_id,
                curva_id,
                quantity,
                ticket_price,
                user,
            });

            res.status(201).json({
                success: true,
                message: "Ticket creado exitosamente por administrador",
                data: new_ticket,
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };

    // ==================== PUT ENDPOINTS ====================

    public change_ticket_status = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) throw new ResponseError(400, "Estado es requerido");

            await this.ticket_service.change_ticket_status({
                ticket_id: id,
                status: status as TicketStatus,
            });

            res.status(200).json({
                success: true,
                message: "Estado del ticket actualizado exitosamente",
            });
        } catch (err) {
            if (err instanceof ResponseError) {
                res.status(err.statusCode).json({
                    success: false,
                    message: err.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar imagen",
                });
            }
        }
    };
}
