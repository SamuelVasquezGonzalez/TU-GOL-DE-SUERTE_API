import { Document } from 'mongoose'

export interface ITransactionHistory extends Document {
  // Información de pago
  payment_reference: string // referencia de pago
  wompi_transaction_id: string // referencia de transacción de Wompi
  payed_amount: number // valor pagado
  payment_status: string // estado del pago (APPROVED, DECLINED, PENDING, etc.)
  
  // Información del cliente
  user_id: string // id del cliente que pagó
  customer_email?: string // email del cliente
  customer_name?: string // nombre del cliente
  
  // Información temporal
  created_at: Date // fecha y hora de creación
  finalized_at?: Date // fecha y hora de finalización
  
  // Información del juego
  soccer_game_id: string // id del partido
  curva_id: string // id de la curva
  results_purchased: string[] // resultados comprados
  
  // Estado de la transacción
  successful_purchase: boolean // true si fue comprado sin problemas (APPROVED)
}









