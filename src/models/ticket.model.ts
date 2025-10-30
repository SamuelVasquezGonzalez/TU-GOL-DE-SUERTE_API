import { ITicket } from '@/contracts/interfaces/ticket.interface'
import { model, Schema } from 'mongoose'

const TicketSchema = new Schema<ITicket>({
  ticket_number: { type: Number, required: true },
  soccer_game_id: { type: String, required: true },
  user_id: { type: String, required: true },
  results_purchased: { type: [String], required: true },
  payed_amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['pending', 'won', 'lost'] },
  curva_id: { type: String, required: true },
  created_date: { type: Date, required: true },
  close: { type: Boolean, required: true, default: false },
  sell_by: { type: String, required: false },
  reward_amount: { type: Number, required: false },

  // Columnas de pago Wompi
  payment_reference: { type: String, required: false },
  payment_status: { type: String, required: false },
  wompi_transaction_id: { type: String, required: false },
  customer_email: { type: String, required: false },
  customer_name: { type: String, required: false },
  customer_phone: { type: String, required: false },
  payment_method: { type: String, required: false },
  payment_amount_cents: { type: Number, required: false },
  payment_currency: { type: String, required: false, default: 'COP' },
  payment_created_at: { type: Date, required: false },
  payment_finalized_at: { type: Date, required: false },
})

export const TicketModel = model<ITicket>('Ticket', TicketSchema)
