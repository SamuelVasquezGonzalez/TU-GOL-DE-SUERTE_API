import { IHouseWinsHistory } from '@/contracts/interfaces/house-wins-history.interface'
import { model, Schema } from 'mongoose'

const HouseWinsHistorySchema = new Schema<IHouseWinsHistory>({
  soccer_game_id: { type: String, required: true },
  reason: { 
    type: String, 
    required: true, 
    enum: ['high_score', 'no_winners'] 
  },
  score: { 
    type: [Number], 
    required: false 
  },
  total_tickets: { type: Number, required: true },
  house_winnings: { type: Number, required: true },
  created_at: { type: Date, required: true, default: Date.now },
  
  // Información adicional
  tournament: { type: String, required: false },
  teams: { type: [String], required: false },
})

// Índices para optimizar búsquedas
HouseWinsHistorySchema.index({ soccer_game_id: 1 })
HouseWinsHistorySchema.index({ created_at: -1 })
HouseWinsHistorySchema.index({ reason: 1 })

export const HouseWinsHistoryModel = model<IHouseWinsHistory>(
  'HouseWinsHistory',
  HouseWinsHistorySchema
)

