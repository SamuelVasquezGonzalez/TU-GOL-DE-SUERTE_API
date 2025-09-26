import { ITicket } from "@/contracts/interfaces/ticket.interface";
import { model, Schema } from "mongoose";

const TicketSchema = new Schema<ITicket>({
    ticket_number: { type: Number, required: true },
    soccer_game_id: { type: String, required: true },
    user_id: { type: String, required: true },
    results_purchased: { type: [String], required: true },
    payed_amount: { type: Number, required: true },
    status: { type: String, required: true, enum: ["pending", "won", "lost"] },
    curva_id: { type: String, required: true },
    created_date: { type: Date, required: true },
    close: { type: Boolean, required: true, default: false }
});

export const TicketModel = model<ITicket>("Ticket", TicketSchema);