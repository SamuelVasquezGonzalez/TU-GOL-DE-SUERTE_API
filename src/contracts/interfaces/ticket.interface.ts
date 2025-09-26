import { Document } from "mongoose";
import type { TicketStatus } from "../types/ticket.type";

export interface ITicket extends Document {
    ticket_number: number // numero de boleta
    soccer_game_id: string // id del partido
    user_id: string // id del usuario
    results_purchased: string[] // resultado de la boleta => 0.0 > 7.7
    payed_amount: number // cantidad de apuesta
    status: TicketStatus // estado de la boleta => pending, won, lost
    curva_id: string // id de la curva donde se compraron los resultado

    created_date: Date // fecha y hora de creacion de la boleta
    close: boolean
}