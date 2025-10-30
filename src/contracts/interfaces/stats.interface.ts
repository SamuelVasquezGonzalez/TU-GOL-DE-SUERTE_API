export interface UserStats {
  user_id: string
  total_tickets: number
  total_games: number
  total_won: number
  total_lost: number
  total_pending: number
  total_amount_spent: number
  total_amount_won: number
}

export interface StaffStats {
  staff_id: string
  staff_name: string
  staff_email: string
  total_sales: number
  total_amount_sold: number
  total_tickets_sold: number
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

