import { ITransactionHistory } from '@/contracts/interfaces/transaction-history.interface'
import { model, Schema } from 'mongoose'

const TransactionHistorySchema = new Schema<ITransactionHistory>({
  // Información de pago
  payment_reference: { type: String, required: true },
  wompi_transaction_id: { type: String, required: true },
  payed_amount: { type: Number, required: true },
  payment_status: { type: String, required: true },
  
  // Información del cliente
  user_id: { type: String, required: true },
  customer_email: { type: String, required: false },
  customer_name: { type: String, required: false },
  
  // Información temporal
  created_at: { type: Date, required: true, default: Date.now },
  finalized_at: { type: Date, required: false },
  
  // Información del juego
  soccer_game_id: { type: String, required: true },
  curva_id: { type: String, required: true },
  results_purchased: { type: [String], required: true },
  
  // Estado de la transacción
  successful_purchase: { type: Boolean, required: true, default: false },
})

// Índices para optimizar búsquedas
TransactionHistorySchema.index({ payment_reference: 1 })
TransactionHistorySchema.index({ wompi_transaction_id: 1 })
TransactionHistorySchema.index({ user_id: 1 })
TransactionHistorySchema.index({ soccer_game_id: 1 })
TransactionHistorySchema.index({ created_at: -1 })
TransactionHistorySchema.index({ payment_status: 1 })
TransactionHistorySchema.index({ successful_purchase: 1 })

export const TransactionHistoryModel = model<ITransactionHistory>(
  'TransactionHistory',
  TransactionHistorySchema
)

