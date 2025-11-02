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
  WeeklyRevenue,
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
      // Cuando un staff vende directamente, el ticket puede no tener payment_status
      // También buscar por ObjectId por si hay tickets antiguos con formato diferente
      const sold_tickets = await TicketModel.find({
        $or: [
          { sell_by: staff_id_str }, // Buscar como string
          { sell_by: staff_id }, // Buscar como ObjectId (para tickets antiguos)
        ],
        // Excluir tickets rechazados explícitamente, pero incluir todos los demás
        $nor: [
          { payment_status: 'DECLINED' },
        ],
      }).lean()

      // Calcular estadísticas de ventas
      const total_tickets_sold = sold_tickets.length
      const total_amount_sold = sold_tickets.reduce(
        (sum, t) => sum + (Number(t.payed_amount) || 0),
        0
      )
      const total_sales = total_tickets_sold // Por ahora es igual al número de tickets

      // Calcular estadísticas por día
      const revenue_by_day = this.calculateDailyStats(sold_tickets)
      const tickets_by_day = this.calculateDailyTicketStats(sold_tickets)

      // Calcular estadísticas por semana
      const revenue_by_week = this.calculateWeeklyStats(sold_tickets)
      const tickets_by_week = this.calculateWeeklyTicketStats(sold_tickets)

      return {
        staff_id: staff_id_str,
        staff_name: staff.name,
        staff_email: staff.email,
        total_sales,
        total_amount_sold,
        total_tickets_sold,
        revenue_by_day,
        revenue_by_week,
        tickets_by_day,
        tickets_by_week,
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

  /**
   * Calcular estadísticas diarias de revenue para staff
   */
  private calculateDailyStats(tickets: any[]): DailyRevenue[] {
    const revenue_by_day_map = new Map<string, { revenue: number; tickets: number }>()

    tickets.forEach((ticket) => {
      const date = ticket.created_date 
        ? dayjs(ticket.created_date).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD')
      
      const existing = revenue_by_day_map.get(date) || { revenue: 0, tickets: 0 }
      const payed_amount = Number(ticket.payed_amount) || 0
      
      revenue_by_day_map.set(date, {
        revenue: existing.revenue + payed_amount,
        tickets: existing.tickets + 1,
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
   * Calcular estadísticas diarias de tickets para staff
   */
  private calculateDailyTicketStats(tickets: any[]): DailyRevenue[] {
    // Es igual a calculateDailyStats, pero se mantiene separado por claridad
    return this.calculateDailyStats(tickets)
  }

  /**
   * Calcular estadísticas semanales de revenue para staff
   */
  private calculateWeeklyStats(tickets: any[]): WeeklyRevenue[] {
    const revenue_by_week_map = new Map<string, { revenue: number; tickets: number; week_start: string; week_end: string }>()

    tickets.forEach((ticket) => {
      if (!ticket.created_date) return
      
      const ticket_date = dayjs(ticket.created_date)
      // dayjs usa domingo (0) como inicio de semana, necesitamos lunes (1)
      // Calcular días desde el lunes (0=lunes, 6=domingo)
      const day_of_week = ticket_date.day() === 0 ? 6 : ticket_date.day() - 1
      
      // Obtener el lunes de la semana actual
      const week_start = ticket_date.subtract(day_of_week, 'day').startOf('day')
      const week_end = week_start.add(6, 'day').endOf('day')
      
      const week_key = `${week_start.format('YYYY-MM-DD')}_${week_end.format('YYYY-MM-DD')}`
      
      const existing = revenue_by_week_map.get(week_key) || { 
        revenue: 0, 
        tickets: 0, 
        week_start: week_start.format('YYYY-MM-DD'),
        week_end: week_end.format('YYYY-MM-DD')
      }
      
      const payed_amount = Number(ticket.payed_amount) || 0
      
      revenue_by_week_map.set(week_key, {
        revenue: existing.revenue + payed_amount,
        tickets: existing.tickets + 1,
        week_start: existing.week_start,
        week_end: existing.week_end,
      })
    })

    return Array.from(revenue_by_week_map.entries())
      .map(([week_key, data]) => ({
        week: `${data.week_start} - ${data.week_end}`,
        week_start: data.week_start,
        week_end: data.week_end,
        revenue: data.revenue,
        tickets: data.tickets,
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
  }

  /**
   * Calcular estadísticas semanales de tickets para staff
   */
  private calculateWeeklyTicketStats(tickets: any[]): WeeklyRevenue[] {
    // Es igual a calculateWeeklyStats, pero se mantiene separado por claridad
    return this.calculateWeeklyStats(tickets)
  }
}

