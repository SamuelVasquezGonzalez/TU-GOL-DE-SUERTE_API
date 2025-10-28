import { Document, model, Schema } from 'mongoose'

export interface IPaymentLog extends Document {
  transaction_id: string
  event_type: string
  payment_status?: string
  raw_payload: any
  processed_at: Date
  error_message?: string
  retry_count: number
}

const PaymentLogSchema = new Schema<IPaymentLog>({
  transaction_id: { type: String, required: true },
  event_type: { type: String, required: true },
  payment_status: { type: String, required: false },
  raw_payload: { type: Schema.Types.Mixed, required: true },
  processed_at: { type: Date, required: true, default: Date.now },
  error_message: { type: String, required: false },
  retry_count: { type: Number, required: true, default: 0 },
})

// Índices para optimizar búsquedas
PaymentLogSchema.index({ transaction_id: 1 })
PaymentLogSchema.index({ event_type: 1 })
PaymentLogSchema.index({ processed_at: 1 })

export const PaymentLogModel = model<IPaymentLog>('PaymentLog', PaymentLogSchema)
