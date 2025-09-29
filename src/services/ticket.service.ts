import { TicketModel } from "@/models/ticket.model";
import { ResponseError } from "@/utils/errors.util";
import { SoccerGameService } from "./soccer_game.service";
import { UserService } from "./user.service";
import { CurvaEntity } from "@/contracts/types/soccer_games.type";
import { TicketStatus } from "@/contracts/types/ticket.type";
import { send_ticket_purchase_email, send_ticket_status_update_email } from "@/emails/email-main";
import dayjs from "dayjs";

export class TicketService {
    // methods

    // GET

    public async get_ticket_by_id({id}: {id: string}) {
        try {
            const ticket = await TicketModel.findById(id).lean();
            if(!ticket) throw new ResponseError(404, "No se encontró la boleta");
            
            const game_service = new SoccerGameService();
            const curva_info = await game_service.get_curva_by_id({id: ticket.curva_id, game_id: ticket.soccer_game_id});

            const game_info = await game_service.get_soccer_game_by_id({id: ticket.soccer_game_id});

            const user_service = new UserService();
            const customer_info = await user_service.get_user_by_id({id: ticket.user_id});

            return {
                ticket,
                game: game_info,
                curva: curva_info,
                customer: customer_info
            };
        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener la boleta");
        }
    }

    public async get_tickets_by_game_id({game_id}: {game_id: string}) {
        try {
            console.log(game_id);
            const tickets = await TicketModel.find().where({soccer_game_id: game_id}).lean();
            if(tickets.length === 0) throw new ResponseError(404, "No se encontraron boletas");
            return tickets;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener las boletas");
        }
    }

    public async get_tickets_by_user_id({user_id}: {user_id: string}) {
        try {
            const tickets = await TicketModel.find({user_id}).lean();
            if(!tickets) throw new ResponseError(404, "No se encontraron boletas para este usuario");
            return tickets;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener las boletas del usuario");
        }
    }

    public async get_tickets_by_curva_id({curva_id}: {curva_id: string}) {
        try {
            const tickets = await TicketModel.find({curva_id}).lean();
            if(!tickets) throw new ResponseError(404, "No se encontraron boletas para esta curva");
            return tickets;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener las boletas de la curva");
        }
    }

    public async get_all_tickets() {
        try {
            const tickets = await TicketModel.find().lean();
            if(!tickets) throw new ResponseError(404, "No se encontraron boletas");
            return tickets;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener todas las boletas");
        }
    }

    // POST

    public async create_new_ticket({
        game_id,
        customer_id,
        curva_id,
        quantity,
        ticket_price,
        user
    }: {
        game_id: string,
        customer_id?: string,
        curva_id?: string,
        quantity: number,
        ticket_price: number,
        user?: {
            name: string,
            email: string,
        }
    }) {
        try {
            const game_service = new SoccerGameService();
            const game_info = await game_service.get_soccer_game_by_id({id: game_id});

            if(!user && !customer_id) throw new ResponseError(400, "El usuario es requerido");

            const user_service = new UserService();
            let customer_info;

            if(customer_id) {
                customer_info = await user_service.get_user_by_id({id: customer_id});
            } else {
                let try_find = await user_service.get_users_by_param({param: user?.email || ""});
                if(try_find.length > 0) {
                    customer_info = try_find[0];
                } else {
                    customer_info = await user_service.create_new_user({
                        name: user?.name || "", 
                        identity: {
                            type_document: "CC",
                            number_document: "W"
                        },
                        phone: "1",
                        role: "customer",
                        email: user?.email || "",
                        password: "1",

                    });
                }
                
            }

            let curva_info: CurvaEntity | null = null;

            if(curva_id) {
                const curva_exist = game_info.curvas_open.find((curva) => curva.id === curva_id);
                if(!curva_exist) throw new ResponseError(404, "No se encontró la curva");
                if(curva_exist.status === "sold_out") throw new ResponseError(404, "La curva ya no tiene resultados disponibles");
                if(curva_exist.status === "closed") throw new ResponseError(404, "La curva ya está cerrada");
                curva_info = curva_exist;
            } else {
                if(game_info.curvas_open.length === 0) throw new ResponseError(404, "No hay curvas abiertas"); // preguntar si el partido tiene curvas abiertas

                const avaliable_curvas = game_info.curvas_open.filter((curva) => {
                    if(curva.status === "open" && curva.avaliable_results.length >= quantity)  return curva;
                }); // preguntar si de las curvas abiertas, hay alguna con resultados disponibles suficientes

                if(avaliable_curvas.length === 0) throw new ResponseError(404, "No hay curvas abiertas con resultados disponibles");
                curva_info = avaliable_curvas[0];
            }
            
            let selected_results: string[] = [];

            for(let i = 0; i < quantity; i++) {
                const random_result = curva_info.avaliable_results[Math.floor(Math.random() * curva_info.avaliable_results.length)]; // seleccionar un resultado aleatorio de las disponibles
                selected_results.push(random_result);

                curva_info.avaliable_results = curva_info.avaliable_results.filter((result) => result !== random_result); // eliminar el resultado seleccionado de las disponibles

                curva_info.sold_results.push(random_result);
            }

            if(curva_info.avaliable_results.length === 0) {
                curva_info.status = "sold_out";
                await game_service.open_new_curva({game_id});
            }

            await game_service.update_curva_results({game_id, curva_id: curva_info.id, curva_updated: curva_info});

            const payed_amount = ticket_price * quantity;

            const ticket_number = await this.generate_ticket_number();

            await TicketModel.create({
                ticket_number: ticket_number,
                soccer_game_id: game_id,
                user_id: customer_id,
                results_purchased: selected_results,
                payed_amount: payed_amount,
                status: "pending",
                curva_id: curva_info.id,
                created_date: new Date()
            });

            
            await send_ticket_purchase_email({
                user_name: customer_info.name,
                user_email: customer_info.email,
                ticket_number: ticket_number,
                game_info: {
                    team1: game_info.soccer_teams[0],
                    team2: game_info.soccer_teams[1],
                    date: dayjs(game_info.start_date).format("DD/MM/YYYY hh:mm A"),
                    tournament: game_info.tournament
                },
                results_purchased: selected_results,
                total_amount: payed_amount
            });

        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear la boleta");
        }
    }

    public async change_ticket_status({ticket_id, status}: {ticket_id: string, status: TicketStatus}) {
        try {
            const ticket = await TicketModel.findById(ticket_id);
            if(!ticket) throw new ResponseError(404, "No se encontró la boleta");
            if(ticket.close) throw new ResponseError(404, "La boleta ya está cerrada");
            
            const old_status = ticket.status;
            ticket.status = status;
            ticket.close = true;
            await ticket.save();

            // Obtener información del usuario y del juego para el email
            const user_service = new UserService();
            const game_service = new SoccerGameService();
            
            const customer_info = await user_service.get_user_by_id({id: ticket.user_id});
            const game_info = await game_service.get_soccer_game_by_id({id: ticket.soccer_game_id});

            // Enviar correo de actualización de estado
            await send_ticket_status_update_email({
                user_name: customer_info.name,
                user_email: customer_info.email,
                ticket_number: ticket.ticket_number,
                old_status: old_status,
                new_status: status,
                game_info: {
                    team1: game_info.soccer_teams[0],
                    team2: game_info.soccer_teams[1],
                    date: dayjs(game_info.start_date).format("DD/MM/YYYY hh:mm A")
                }
            });
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al cambiar el estado de la boleta");
        }
    }

    // private methods

    private async generate_ticket_number(): Promise<number> {
        try {
            const last_ticket = await TicketModel.findOne().select("ticket_number").sort({created_date: -1}).lean();
            if(!last_ticket) return 1000;
            return last_ticket.ticket_number + 1;
        } catch (error) {
            if(error instanceof ResponseError) throw error; 
            throw new ResponseError(500, "Error al generar el numero de boleta");
        }
    }
}