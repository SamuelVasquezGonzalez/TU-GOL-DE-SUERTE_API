import { ResponseError } from '@/utils/errors.util'
import { TicketModel } from '@/models/ticket.model'
import { UserModel } from '@/models/user.model'
import { SoccerGameModel } from '@/models/soccer_games.model'
import { TransactionHistoryModel } from '@/models/transaction-history.model'
import { TournamentModel } from '@/models/tournament.model'
import { SoccerTeamsService } from './soccer_teams.service'
import {
  UserStats,
  StaffStats,
  GeneralStats,
  DailyRevenue,
  GameRevenue,
  TournamentRevenue,
  DateRevenue,
  HourRevenue,
} from '@/contracts/interfaces/stats.interface'
import dayjs from 'dayjs'

export class StatsService {
  /**
   * Obtener estadísticas de un usuario específico
   */
  public async getUserStats(user_id: string): Promise<UserStats> {
    try {
      // Convertir user_id a string para asegurar consistencia
      const user_id_str = String(user_id)
      
      const user = await UserModel.findById(user_id_str).lean()
      if (!user) throw new ResponseError(404, 'Usuario no encontrado')

      // Obtener todos los tickets del usuario (convertir el user_id a string para la búsqueda)
      const tickets = await TicketModel.find({ 
        user_id: user_id_str 
      }).lean()

      // Calcular estadísticas
      const total_tickets = tickets.length
      const unique_games = new Set(
        tickets.map((t) => String(t.soccer_game_id || ''))
      )
      const total_games = unique_games.size

      const total_won = tickets.filter((t) => t.status === 'won').length
      const total_lost = tickets.filter((t) => t.status === 'lost').length
      const total_pending = tickets.filter((t) => t.status === 'pending').length

      const total_amount_spent = tickets.reduce(
        (sum, t) => sum + (Number(t.payed_amount) || 0),
        0
      )

      // Calcular ganancias usando reward_amount de los tickets ganados
      const won_tickets = tickets.filter((t) => t.status === 'won')
      const total_amount_won = won_tickets.reduce((sum, t) => {
        // Usar reward_amount si existe, sino usar payed_amount como fallback
        return sum + (Number(t.reward_amount) || Number(t.payed_amount) || 0)
      }, 0)

      return {
        user_id: user_id_str,
        total_tickets,
        total_games,
        total_won,
        total_lost,
        total_pending,
        total_amount_spent,
        total_amount_won,
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener estadísticas del usuario')
    }
  }

  /**
   * Obtener estadísticas del staff en sesión
   */
  public async getStaffStats(staff_id: string): Promise<StaffStats> {
    try {
      // Convertir staff_id a string para asegurar consistencia
      const staff_id_str = String(staff_id)
      
      const staff = await UserModel.findById(staff_id_str).lean()
      if (!staff) throw new ResponseError(404, 'Staff no encontrado')

      if (staff.role !== 'staff' && staff.role !== 'admin') {
        throw new ResponseError(403, 'El usuario no es un staff')
      }

      // Obtener todos los tickets vendidos por este staff
      // Buscar con el staff_id convertido a string
      const sold_tickets = await TicketModel.find({
        sell_by: staff_id_str,
        payment_status: 'APPROVED', // Solo contar tickets pagados exitosamente
      }).lean()

      // Calcular estadísticas de ventas
      const total_tickets_sold = sold_tickets.length
      const total_amount_sold = sold_tickets.reduce(
        (sum, t) => sum + (Number(t.payed_amount) || 0),
        0
      )
      const total_sales = total_tickets_sold // Por ahora es igual al número de tickets

      return {
        staff_id: staff_id_str,
        staff_name: staff.name,
        staff_email: staff.email,
        total_sales,
        total_amount_sold,
        total_tickets_sold,
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener estadísticas del staff')
    }
  }

  /**
   * Obtener estadísticas generales del sistema
   */
  public async getGeneralStats(): Promise<GeneralStats> {
    try {
      // Obtener tickets aprobados (solo los que se pagaron exitosamente)
      const approved_tickets = await TicketModel.find({
        payment_status: 'APPROVED',
      }).lean()

      // Obtener todas las transacciones exitosas del historial
      const successful_transactions = await TransactionHistoryModel.find({
        successful_purchase: true,
        payment_status: 'APPROVED',
      }).lean()

      // Calcular el revenue desde ambos: tickets y transacciones para tener datos completos
      // Preferir transacciones del historial, pero también sumar desde tickets si faltan
      const revenue_from_transactions = successful_transactions.reduce(
        (sum, t) => sum + (Number(t.payed_amount) || 0),
        0
      )
      
      // También calcular desde tickets aprobados como respaldo
      const revenue_from_tickets = approved_tickets.reduce(
        (sum, t) => sum + (Number(t.payed_amount) || 0),
        0
      )
      
      // Usar el mayor valor o el de transacciones si existe
      const total_revenue = revenue_from_transactions > 0 
        ? revenue_from_transactions 
        : revenue_from_tickets
      
      const total_tickets = approved_tickets.length

      const games = await SoccerGameModel.find().lean()
      const total_games = games.length

      const users = await UserModel.find({ role: 'customer' }).lean()
      const total_users = users.length

      const staff_members = await UserModel.find({
        role: { $in: ['staff', 'admin'] },
      }).lean()
      const total_staff = staff_members.length

      // Estadísticas por día
      const revenue_by_day = await this.getRevenueByDay(successful_transactions)

      // Estadísticas por partido
      const revenue_by_game = await this.getRevenueByGame(
        successful_transactions,
        games
      )

      // Estadísticas por torneo
      const revenue_by_tournament = await this.getRevenueByTournament(
        successful_transactions,
        games
      )

      // Estadísticas por fecha
      const revenue_by_date = await this.getRevenueByDate(successful_transactions)

      // Estadísticas por hora
      const revenue_by_hour = await this.getRevenueByHour(successful_transactions)

      return {
        total_revenue,
        total_tickets,
        total_games,
        total_users,
        total_staff,
        revenue_by_day,
        revenue_by_game,
        revenue_by_tournament,
        revenue_by_date,
        revenue_by_hour,
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener estadísticas generales')
    }
  }

  /**
   * Obtener ingresos agrupados por día
   */
  private async getRevenueByDay(
    transactions: any[]
  ): Promise<DailyRevenue[]> {
    const revenue_by_day_map = new Map<string, { revenue: number; tickets: number }>()

    transactions.forEach((transaction) => {
      if (!transaction.created_at) return
      
      const date = dayjs(transaction.created_at).format('YYYY-MM-DD')
      const existing = revenue_by_day_map.get(date) || { revenue: 0, tickets: 0 }
      const payed_amount = Number(transaction.payed_amount) || 0
      const tickets_count = Array.isArray(transaction.results_purchased) 
        ? transaction.results_purchased.length 
        : 1
      
      revenue_by_day_map.set(date, {
        revenue: existing.revenue + payed_amount,
        tickets: existing.tickets + tickets_count,
      })
    })

    return Array.from(revenue_by_day_map.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        tickets: data.tickets,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Obtener ingresos agrupados por partido
   */
  private async getRevenueByGame(
    transactions: any[],
    games: any[]
  ): Promise<GameRevenue[]> {
    const revenue_by_game_map = new Map<
      string,
      { revenue: number; tickets: number; game_name: string }
    >()

    // Obtener todos los equipos
    const soccer_teams_service = new SoccerTeamsService()
    const all_teams = await soccer_teams_service.get_all_soccer_teams()

    // Crear mapa de equipos
    const teams_map = new Map<string, string>()
    all_teams.forEach((team) => {
      const team_id = String((team as any)._id?.toString() || (team as any).id || '')
      teams_map.set(team_id, team.name || 'Equipo desconocido')
    })

    // Crear mapa de partidos con IDs de equipos (convertir todos los IDs a string)
    const game_map = new Map<string, { team1_id: string; team2_id: string; tournament: any }>()
    games.forEach((game) => {
      const game_id_str = String(game._id || '')
      game_map.set(game_id_str, {
        team1_id: String(game.soccer_teams?.[0] || ''),
        team2_id: String(game.soccer_teams?.[1] || ''),
        tournament: game.tournament,
      })
    })

    transactions.forEach((transaction) => {
      if (!transaction.soccer_game_id) return
      
      // Convertir game_id a string para comparación consistente
      const game_id = String(transaction.soccer_game_id)
      const game_info = game_map.get(game_id)

      if (game_info) {
        const team1_name = teams_map.get(String(game_info.team1_id)) || String(game_info.team1_id)
        const team2_name = teams_map.get(String(game_info.team2_id)) || String(game_info.team2_id)
        const game_name = `${team1_name} vs ${team2_name}`

        const existing = revenue_by_game_map.get(game_id) || {
          revenue: 0,
          tickets: 0,
          game_name,
        }
        
        const payed_amount = Number(transaction.payed_amount) || 0
        const tickets_count = Array.isArray(transaction.results_purchased) 
          ? transaction.results_purchased.length 
          : 1
        
        revenue_by_game_map.set(game_id, {
          revenue: existing.revenue + payed_amount,
          tickets: existing.tickets + tickets_count,
          game_name: existing.game_name || game_name,
        })
      }
    })

    return Array.from(revenue_by_game_map.entries())
      .map(([game_id, data]) => ({
        game_id,
        game_name: data.game_name,
        revenue: data.revenue,
        tickets: data.tickets,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  /**
   * Obtener ingresos agrupados por torneo
   */
  private async getRevenueByTournament(
    transactions: any[],
    games: any[]
  ): Promise<TournamentRevenue[]> {
    const revenue_by_tournament_map = new Map<
      string,
      { revenue: number; tickets: number; tournament_name: string }
    >()

    // Crear mapa de torneos
    const game_tournament_map = new Map()
    games.forEach((game) => {
      game_tournament_map.set(game._id.toString(), game.tournament)
    })

    // Obtener todos los torneos
    const tournaments = await TournamentModel.find().lean()
    const tournament_map = new Map()
    tournaments.forEach((t) => {
      tournament_map.set(t._id.toString(), t.name)
    })

    transactions.forEach((transaction) => {
      if (!transaction.soccer_game_id) return
      
      // Convertir game_id a string para comparación consistente
      const game_id = String(transaction.soccer_game_id)
      const tournament_id = game_tournament_map.get(game_id)

      if (tournament_id) {
        const tournament_id_str = String(tournament_id)
        const tournament_name = tournament_map.get(tournament_id_str) || tournament_id_str

        const existing = revenue_by_tournament_map.get(tournament_id_str) || {
          revenue: 0,
          tickets: 0,
          tournament_name,
        }
        
        const payed_amount = Number(transaction.payed_amount) || 0
        const tickets_count = Array.isArray(transaction.results_purchased) 
          ? transaction.results_purchased.length 
          : 1
        
        revenue_by_tournament_map.set(tournament_id_str, {
          revenue: existing.revenue + payed_amount,
          tickets: existing.tickets + tickets_count,
          tournament_name: existing.tournament_name || tournament_name,
        })
      }
    })

    return Array.from(revenue_by_tournament_map.entries())
      .map(([tournament_id, data]) => ({
        tournament_id,
        tournament_name: data.tournament_name,
        revenue: data.revenue,
        tickets: data.tickets,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }

  /**
   * Obtener ingresos agrupados por fecha
   */
  private async getRevenueByDate(
    transactions: any[]
  ): Promise<DateRevenue[]> {
    const revenue_by_date_map = new Map<string, { revenue: number; tickets: number }>()

    transactions.forEach((transaction) => {
      if (!transaction.created_at) return
      
      const date = dayjs(transaction.created_at).format('YYYY-MM-DD')
      const existing = revenue_by_date_map.get(date) || { revenue: 0, tickets: 0 }
      const payed_amount = Number(transaction.payed_amount) || 0
      const tickets_count = Array.isArray(transaction.results_purchased) 
        ? transaction.results_purchased.length 
        : 1
      
      revenue_by_date_map.set(date, {
        revenue: existing.revenue + payed_amount,
        tickets: existing.tickets + tickets_count,
      })
    })

    return Array.from(revenue_by_date_map.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        tickets: data.tickets,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Obtener ingresos agrupados por hora
   */
  private async getRevenueByHour(
    transactions: any[]
  ): Promise<HourRevenue[]> {
    const revenue_by_hour_map = new Map<number, { revenue: number; tickets: number }>()

    transactions.forEach((transaction) => {
      if (!transaction.created_at) return
      
      const hour = dayjs(transaction.created_at).hour()
      const existing = revenue_by_hour_map.get(hour) || { revenue: 0, tickets: 0 }
      const payed_amount = Number(transaction.payed_amount) || 0
      const tickets_count = Array.isArray(transaction.results_purchased) 
        ? transaction.results_purchased.length 
        : 1
      
      revenue_by_hour_map.set(hour, {
        revenue: existing.revenue + payed_amount,
        tickets: existing.tickets + tickets_count,
      })
    })

    // Crear array para todas las horas (0-23)
    const hours_array: HourRevenue[] = []
    for (let hour = 0; hour < 24; hour++) {
      const data = revenue_by_hour_map.get(hour) || { revenue: 0, tickets: 0 }
      hours_array.push({
        hour,
        revenue: data.revenue,
        tickets: data.tickets,
      })
    }

    return hours_array.sort((a, b) => a.hour - b.hour)
  }
}

