import { Document } from 'mongoose'

export interface IHouseWinsHistory extends Document {
  soccer_game_id: string // ID del partido donde ganó la casa
  reason: 'high_score' | 'no_winners' // Razón por la que ganó la casa
  score?: [number, number] // Marcador cuando aplica (solo para high_score)
  total_tickets: number // Total de tickets vendidos en ese partido
  house_winnings: number // Total que ganó la casa (suma de todos los tickets vendidos)
  created_at: Date // Fecha y hora cuando ganó la casa
  
  // Información adicional para referencia
  tournament?: string // Nombre del torneo
  teams?: [string, string] // Nombres de los equipos
}

