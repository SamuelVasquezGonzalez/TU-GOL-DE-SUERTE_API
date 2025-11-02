export interface UserStats {
  user_id: string
  total_tickets: number
  total_games: number
  total_won: number
  total_lost: number
  total_pending: number
  total_amount_spent: number
  total_amount_won: number
  // Estadísticas para gráficos
  spending_by_day: DailySpending[]
  spending_by_week: WeeklySpending[]
  earnings_by_day: DailyEarnings[]
  earnings_by_week: WeeklyEarnings[]
  tickets_by_day: DailyTicketStats[]
  tickets_by_week: WeeklyTicketStats[]
  tickets_by_game: GameTicketStats[]
  tickets_by_tournament: TournamentTicketStats[]
  tickets_by_status: StatusDistribution[]
  tickets_by_hour: HourTicketStats[]
  win_rate_by_period: WinRatePeriod[]
}

export interface DailySpending {
  date: string
  amount_spent: number
  tickets: number
}

export interface WeeklySpending {
  week: string
  week_start: string
  week_end: string
  amount_spent: number
  tickets: number
}

export interface DailyEarnings {
  date: string
  amount_won: number
  tickets_won: number
}

export interface WeeklyEarnings {
  week: string
  week_start: string
  week_end: string
  amount_won: number
  tickets_won: number
}

export interface DailyTicketStats {
  date: string
  total: number
  won: number
  lost: number
  pending: number
}

export interface WeeklyTicketStats {
  week: string
  week_start: string
  week_end: string
  total: number
  won: number
  lost: number
  pending: number
}

export interface GameTicketStats {
  game_id: string
  game_name: string
  total_tickets: number
  won: number
  lost: number
  pending: number
  amount_spent: number
  amount_won: number
}

export interface TournamentTicketStats {
  tournament_id: string
  tournament_name: string
  total_tickets: number
  won: number
  lost: number
  pending: number
  amount_spent: number
  amount_won: number
}

export interface StatusDistribution {
  status: 'won' | 'lost' | 'pending'
  count: number
  percentage: number
}

export interface HourTicketStats {
  hour: number
  tickets: number
  amount_spent: number
}

export interface WinRatePeriod {
  period: string // 'day' o 'week'
  date?: string // Para días
  week_start?: string // Para semanas
  week_end?: string // Para semanas
  win_rate: number // Porcentaje de victorias (0-100)
  total_tickets: number
  won: number
  lost: number
}

export interface StaffStats {
  staff_id: string
  staff_name: string
  staff_email: string
  total_sales: number
  total_amount_sold: number
  total_tickets_sold: number
  revenue_by_day: DailyRevenue[]
  revenue_by_week: WeeklyRevenue[]
  tickets_by_day: DailyRevenue[]
  tickets_by_week: WeeklyRevenue[]
}

export interface WeeklyRevenue {
  week: string // Formato: "YYYY-WW" o "YYYY-MM-DD (inicio semana)"
  week_start: string // Fecha de inicio de la semana (YYYY-MM-DD)
  week_end: string // Fecha de fin de la semana (YYYY-MM-DD)
  revenue: number
  tickets: number
}

export interface GeneralStats {
  total_revenue: number
  total_tickets: number
  total_games: number
  total_users: number
  total_staff: number
  revenue_by_day: DailyRevenue[]
  revenue_by_game: GameRevenue[]
  revenue_by_tournament: TournamentRevenue[]
  revenue_by_date: DateRevenue[]
  revenue_by_hour: HourRevenue[]
}

export interface DailyRevenue {
  date: string
  revenue: number
  tickets: number
}

export interface GameRevenue {
  game_id: string
  game_name: string
  revenue: number
  tickets: number
}

export interface TournamentRevenue {
  tournament_id: string
  tournament_name: string
  revenue: number
  tickets: number
}

export interface DateRevenue {
  date: string
  revenue: number
  tickets: number
}

export interface HourRevenue {
  hour: number
  revenue: number
  tickets: number
}

