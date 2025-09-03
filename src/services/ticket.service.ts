import { TicketModel } from "@/models/ticket.model";
import { ResponseError } from "@/utils/errors.util";
import { SoccerGameService } from "./soccer_game.service";
import { UserService } from "./user.service";
import { CurvaEntity } from "@/contracts/types/soccer_games.type";
import { TicketStatus } from "@/contracts/types/ticket.type";

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
            const tickets = await TicketModel.find({soccer_game_id: game_id}).lean();
            if(!tickets) throw new ResponseError(404, "No se encontraron boletas");
            return tickets;
        } catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al obtener las boletas");
        }
    }

    // POST

    public async create_new_ticket({
        game_id,
        customer_id,
        curva_id,
        quantity,
        ticket_price
    }: {
        game_id: string,
        customer_id: string,
        curva_id?: string,
        quantity: number,
        ticket_price: number
    }) {
        try {
            const game_service = new SoccerGameService();
            const game_info = await game_service.get_soccer_game_by_id({id: game_id});

            const user_service = new UserService();
            await user_service.get_user_by_id({id: customer_id});

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
            }

            await game_service.update_curva_results({game_id, curva_id: curva_info.id, curva_updated: curva_info});

            const payed_amount = ticket_price * quantity;

            await TicketModel.create({
                ticket_number: await this.generate_ticket_number(),
                soccer_game_id: game_id,
                user_id: customer_id,
                results_purchased: selected_results,
                payed_amount: payed_amount,
                status: "pending",
                curva_id: curva_info.id,
                created_date: new Date()
            });

            // * TODO: Enviar correo de compra de boleta

        }
        catch (err) {
            if(err instanceof ResponseError) throw err;
            throw new ResponseError(500, "Error al crear la boleta");
        }
    }

    public async change_ticket_status({ticket_id, status}: {ticket_id: string, status: TicketStatus}) {
        try {
            const ticket = await TicketModel.findById(ticket_id).lean();
            if(!ticket) throw new ResponseError(404, "No se encontró la boleta");
            ticket.status = status;
            await ticket.save();

            // * TODO: Informar al usuario del cambio de estado de la boleta
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