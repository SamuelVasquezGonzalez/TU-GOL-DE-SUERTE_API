import { IStaffCommissionHistory } from '@/contracts/interfaces/staff-commission-history.interface'
import { model, Schema } from 'mongoose'

const StaffCommissionHistorySchema = new Schema<IStaffCommissionHistory>({
  // Información del staff
  staff_id: { type: String, required: true },
  staff_name: { type: String, required: true },
  staff_email: { type: String, required: true },
  
  // Información del partido
  soccer_game_id: { type: String, required: true },
  game_date: { type: Date, required: false },
  
  // Información de ventas físicas
  total_tickets_sold: { type: Number, required: true },
  total_amount_sold: { type: Number, required: true },
  
  // Cálculo de comisiones
  commission_percentage: { type: Number, required: true, default: 2.5 },
  commission_amount: { type: Number, required: true },
  transaction_cost: { type: Number, required: true, default: 700 },
  total_transaction_costs: { type: Number, required: true },
  net_commission: { type: Number, required: true },
  
  // Información de Wompi (solo informativa)
  wompi_commission_percentage: { type: Number, required: true, default: 19 },
  wompi_commission_amount: { type: Number, required: true },
  
  // Información temporal
  created_at: { type: Date, required: true, default: Date.now },
  game_finished_at: { type: Date, required: true },
})

// Índices para optimizar búsquedas
StaffCommissionHistorySchema.index({ staff_id: 1 })
StaffCommissionHistorySchema.index({ soccer_game_id: 1 })
StaffCommissionHistorySchema.index({ staff_id: 1, soccer_game_id: 1 })
StaffCommissionHistorySchema.index({ created_at: -1 })
StaffCommissionHistorySchema.index({ game_finished_at: -1 })

export const StaffCommissionHistoryModel = model<IStaffCommissionHistory>(
  'StaffCommissionHistory',
  StaffCommissionHistorySchema
)

