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
      const user = await UserModel.findById(user_id).lean()
      if (!user) throw new ResponseError(404, 'Usuario no encontrado')

      // Obtener todos los tickets del usuario
      const tickets = await TicketModel.find({ user_id }).lean()

      // Calcular estadísticas
      const total_tickets = tickets.length
      const unique_games = new Set(tickets.map((t) => t.soccer_game_id.toString()))
      const total_games = unique_games.size

      const total_won = tickets.filter((t) => t.status === 'won').length
      const total_lost = tickets.filter((t) => t.status === 'lost').length
      const total_pending = tickets.filter((t) => t.status === 'pending').length

      const total_amount_spent = tickets.reduce((sum, t) => sum + t.payed_amount, 0)

      // Calcular ganancias usando reward_amount de los tickets ganados
      const won_tickets = tickets.filter((t) => t.status === 'won')
      const total_amount_won = won_tickets.reduce((sum, t) => {
        // Usar reward_amount si existe, sino usar payed_amount como fallback
        return sum + (t.reward_amount || t.payed_amount || 0)
      }, 0)

      return {
        user_id,
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
      const staff = await UserModel.findById(staff_id).lean()
      if (!staff) throw new ResponseError(404, 'Staff no encontrado')

      if (staff.role !== 'staff' && staff.role !== 'admin') {
        throw new ResponseError(403, 'El usuario no es un staff')
      }

      // Obtener todos los tickets vendidos por este staff
      const sold_tickets = await TicketModel.find({
        sell_by: staff_id,
        payment_status: 'APPROVED', // Solo contar tickets pagados exitosamente
      }).lean()

      // Calcular estadísticas de ventas
      const total_tickets_sold = sold_tickets.length
      const total_amount_sold = sold_tickets.reduce(
        (sum, t) => sum + (t.payed_amount || 0),
        0
      )
      const total_sales = total_tickets_sold // Por ahora es igual al número de tickets

      return {
        staff_id,
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

      // Estadísticas básicas
      const total_revenue = successful_transactions.reduce(
        (sum, t) => sum + t.payed_amount,
        0
      )
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
      const date = dayjs(transaction.created_at).format('YYYY-MM-DD')
      const existing = revenue_by_day_map.get(date) || { revenue: 0, tickets: 0 }
      revenue_by_day_map.set(date, {
        revenue: existing.revenue + transaction.payed_amount,
        tickets: existing.tickets + transaction.results_purchased.length,
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
    const teams_map = new Map()
    all_teams.forEach((team) => {
      const team_id = (team as any)._id?.toString() || (team as any).id
      teams_map.set(team_id, team.name)
    })

    // Crear mapa de partidos con IDs de equipos
    const game_map = new Map()
    games.forEach((game) => {
      game_map.set(game._id.toString(), {
        team1_id: game.soccer_teams[0],
        team2_id: game.soccer_teams[1],
        tournament: game.tournament,
      })
    })

    transactions.forEach((transaction) => {
      const game_id = transaction.soccer_game_id
      const game_info = game_map.get(game_id)

      if (game_info) {
        const team1_name = teams_map.get(game_info.team1_id) || game_info.team1_id
        const team2_name = teams_map.get(game_info.team2_id) || game_info.team2_id
        const game_name = `${team1_name} vs ${team2_name}`

        const existing = revenue_by_game_map.get(game_id) || {
          revenue: 0,
          tickets: 0,
          game_name,
        }
        revenue_by_game_map.set(game_id, {
          revenue: existing.revenue + transaction.payed_amount,
          tickets: existing.tickets + transaction.results_purchased.length,
          game_name: existing.game_name,
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
      const game_id = transaction.soccer_game_id
      const tournament_id = game_tournament_map.get(game_id)

      if (tournament_id) {
        const tournament_name = tournament_map.get(tournament_id) || tournament_id

        const existing = revenue_by_tournament_map.get(tournament_id) || {
          revenue: 0,
          tickets: 0,
          tournament_name,
        }
        revenue_by_tournament_map.set(tournament_id, {
          revenue: existing.revenue + transaction.payed_amount,
          tickets: existing.tickets + transaction.results_purchased.length,
          tournament_name: existing.tournament_name,
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
      const date = dayjs(transaction.created_at).format('YYYY-MM-DD')
      const existing = revenue_by_date_map.get(date) || { revenue: 0, tickets: 0 }
      revenue_by_date_map.set(date, {
        revenue: existing.revenue + transaction.payed_amount,
        tickets: existing.tickets + transaction.results_purchased.length,
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
      const hour = dayjs(transaction.created_at).hour()
      const existing = revenue_by_hour_map.get(hour) || { revenue: 0, tickets: 0 }
      revenue_by_hour_map.set(hour, {
        revenue: existing.revenue + transaction.payed_amount,
        tickets: existing.tickets + transaction.results_purchased.length,
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

