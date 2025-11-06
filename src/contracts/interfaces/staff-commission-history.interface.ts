import { Document } from 'mongoose'

export interface IStaffCommissionHistory extends Document {
  // Información del staff
  staff_id: string // id del staff que vendió
  staff_name: string // nombre del staff
  staff_email: string // email del staff
  
  // Información del partido
  soccer_game_id: string // id del partido
  game_date?: Date // fecha del partido (opcional, para facilitar consultas)
  
  // Información de ventas físicas
  total_tickets_sold: number // número total de boletas vendidas físicamente
  total_amount_sold: number // monto total vendido (suma de payed_amount)
  
  // Cálculo de comisiones
  commission_percentage: number // porcentaje de comisión (2.5%)
  commission_amount: number // monto de comisión antes de descuentos (total_amount_sold × 2.5%)
  transaction_cost: number // costo por transacción (700)
  total_transaction_costs: number // costo total de transacciones (total_tickets_sold × 700)
  net_commission: number // comisión neta del staff (commission_amount - total_transaction_costs)
  
  // Información de Wompi (solo informativa)
  wompi_commission_percentage: number // porcentaje de comisión de Wompi (19%)
  wompi_commission_amount: number // monto de comisión de Wompi (total_amount_sold × 19%)
  
  // Información temporal
  created_at: Date // fecha y hora de creación del registro
  game_finished_at: Date // fecha y hora en que se finalizó el partido
}

