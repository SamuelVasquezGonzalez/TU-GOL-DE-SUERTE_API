import { Document } from 'mongoose'
import type { TicketStatus } from '../types/ticket.type'

export interface ITicket extends Document {
  ticket_number: number // numero de boleta
  soccer_game_id: string // id del partido
  user_id: string // id del usuario
  results_purchased: string[] // resultado de la boleta => 0.0 > 7.7
  payed_amount: number // cantidad de apuesta
  status: TicketStatus // estado de la boleta => pending, won, lost
  curva_id: string // id de la curva donde se compraron los resultado
  sell_by?: string // id del usuario que vendio la boleta
  reward_amount?: number // cantidad de ganancia

  created_date: Date // fecha y hora de creacion de la boleta
  close: boolean

  // Columnas de pago Wompi
  payment_reference?: string // referencia única del pago
  payment_status?: string // estado del pago (PENDING, APPROVED, DECLINED, etc)
  wompi_transaction_id?: string // ID de transacción de Wompi
  customer_email?: string // email del cliente para el pago
  customer_name?: string // nombre del cliente para el pago
  customer_phone?: string // teléfono del cliente para el pago
  payment_method?: string // método de pago usado
  payment_amount_cents?: number // monto en centavos
  payment_currency?: string // moneda del pago
  payment_created_at?: Date // fecha de creación del pago
  payment_finalized_at?: Date // fecha de finalización del pago
}
