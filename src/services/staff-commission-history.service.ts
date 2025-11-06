import { StaffCommissionHistoryModel } from '@/models/staff-commission-history.model'
import { TicketModel } from '@/models/ticket.model'
import { UserModel } from '@/models/user.model'
import { ResponseError } from '@/utils/errors.util'

export class StaffCommissionHistoryService {
  // Constantes de comisión
  private readonly STAFF_COMMISSION_PERCENTAGE = 2.5
  private readonly TRANSACTION_COST = 700
  private readonly WOMPI_COMMISSION_PERCENTAGE = 19

  /**
   * Calcular y guardar comisiones de todos los staff para un partido finalizado
   */
  public async calculate_and_save_commissions_for_game({
    game_id,
    game_finished_at,
  }: {
    game_id: string
    game_finished_at: Date
  }) {
    try {
      // Obtener todas las boletas físicas vendidas en este partido
      // Ventas físicas: tienen sell_by pero NO tienen wompi_transaction_id
      const physical_tickets = await TicketModel.find({
        soccer_game_id: game_id,
        sell_by: { $exists: true, $ne: null },
        $or: [
          { wompi_transaction_id: { $exists: false } },
          { wompi_transaction_id: null },
        ],
      }).lean()

      if (physical_tickets.length === 0) {
        // No hay ventas físicas, no hay comisiones que calcular
        return { message: 'No hay ventas físicas para calcular comisiones', commissions_created: 0 }
      }

      // Agrupar boletas por staff
      const tickets_by_staff = new Map<string, typeof physical_tickets>()

      for (const ticket of physical_tickets) {
        if (ticket.sell_by) {
          const staff_id = String(ticket.sell_by)
          if (!tickets_by_staff.has(staff_id)) {
            tickets_by_staff.set(staff_id, [])
          }
          tickets_by_staff.get(staff_id)!.push(ticket)
        }
      }

      // Calcular y guardar comisiones para cada staff
      const commissions_created = []
      const game_finished_date = new Date(game_finished_at)

      for (const [staff_id, tickets] of tickets_by_staff.entries()) {
        // Obtener información del staff
        const staff = await UserModel.findById(staff_id).lean()
        if (!staff) {
          console.warn(`⚠️ Staff con ID ${staff_id} no encontrado, saltando cálculo de comisiones`)
          continue
        }

        // Calcular totales
        const total_tickets_sold = tickets.length
        const total_amount_sold = tickets.reduce((sum, ticket) => sum + (Number(ticket.payed_amount) || 0), 0)

        // Calcular comisiones
        const commission_amount = (total_amount_sold * this.STAFF_COMMISSION_PERCENTAGE) / 100
        const total_transaction_costs = total_tickets_sold * this.TRANSACTION_COST
        const net_commission = commission_amount - total_transaction_costs
        const wompi_commission_amount = (total_amount_sold * this.WOMPI_COMMISSION_PERCENTAGE) / 100

        // Verificar si ya existe un registro para este staff y partido
        const existing_commission = await StaffCommissionHistoryModel.findOne({
          staff_id: staff_id,
          soccer_game_id: game_id,
        })

        if (existing_commission) {
          // Actualizar el registro existente
          existing_commission.total_tickets_sold = total_tickets_sold
          existing_commission.total_amount_sold = total_amount_sold
          existing_commission.commission_amount = commission_amount
          existing_commission.total_transaction_costs = total_transaction_costs
          existing_commission.net_commission = net_commission
          existing_commission.wompi_commission_amount = wompi_commission_amount
          existing_commission.game_finished_at = game_finished_date
          await existing_commission.save()
          commissions_created.push(existing_commission.toObject())
        } else {
          // Crear nuevo registro
          const commission_history = await StaffCommissionHistoryModel.create({
            staff_id: staff_id,
            staff_name: staff.name,
            staff_email: staff.email,
            soccer_game_id: game_id,
            total_tickets_sold: total_tickets_sold,
            total_amount_sold: total_amount_sold,
            commission_percentage: this.STAFF_COMMISSION_PERCENTAGE,
            commission_amount: commission_amount,
            transaction_cost: this.TRANSACTION_COST,
            total_transaction_costs: total_transaction_costs,
            net_commission: net_commission,
            wompi_commission_percentage: this.WOMPI_COMMISSION_PERCENTAGE,
            wompi_commission_amount: wompi_commission_amount,
            game_finished_at: game_finished_date,
          })
          commissions_created.push(commission_history.toObject())
        }
      }

      return {
        message: `Comisiones calculadas y guardadas para ${commissions_created.length} staff`,
        commissions_created: commissions_created.length,
        commissions: commissions_created,
      }
    } catch (err) {
      console.error('❌ [StaffCommissionHistoryService] Error calculando comisiones:', err)
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al calcular y guardar las comisiones')
    }
  }

  /**
   * Obtener comisiones de un staff específico
   */
  public async get_staff_commissions({ staff_id }: { staff_id: string }) {
    try {
      const commissions = await StaffCommissionHistoryModel.find({
        staff_id: staff_id,
      })
        .sort({ game_finished_at: -1 })
        .lean()

      // Calcular total acumulado
      const total_commission = commissions.reduce((sum, comm) => sum + (comm.net_commission || 0), 0)
      const total_tickets = commissions.reduce((sum, comm) => sum + (comm.total_tickets_sold || 0), 0)
      const total_amount = commissions.reduce((sum, comm) => sum + (comm.total_amount_sold || 0), 0)

      return {
        commissions: commissions,
        totals: {
          total_net_commission: total_commission,
          total_tickets_sold: total_tickets,
          total_amount_sold: total_amount,
        },
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener las comisiones del staff')
    }
  }

  /**
   * Obtener comisiones de un staff por partido específico
   */
  public async get_staff_commission_by_game({
    staff_id,
    game_id,
  }: {
    staff_id: string
    game_id: string
  }) {
    try {
      const commission = await StaffCommissionHistoryModel.findOne({
        staff_id: staff_id,
        soccer_game_id: game_id,
      }).lean()

      if (!commission) {
        throw new ResponseError(404, 'No se encontró comisión para este staff en este partido')
      }

      return commission
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener la comisión del staff por partido')
    }
  }

  /**
   * Obtener todas las comisiones de todos los staff (para admin)
   */
  public async get_all_commissions({ game_id }: { game_id?: string }) {
    try {
      const query = game_id ? { soccer_game_id: game_id } : {}
      const commissions = await StaffCommissionHistoryModel.find(query)
        .sort({ game_finished_at: -1 })
        .lean()

      // Agrupar por staff para calcular totales
      const staff_totals = new Map<string, {
        staff_id: string
        staff_name: string
        staff_email: string
        total_net_commission: number
        total_tickets_sold: number
        total_amount_sold: number
        commissions_count: number
      }>()

      for (const commission of commissions) {
        const staff_id = String(commission.staff_id)
        if (!staff_totals.has(staff_id)) {
          staff_totals.set(staff_id, {
            staff_id: staff_id,
            staff_name: commission.staff_name,
            staff_email: commission.staff_email,
            total_net_commission: 0,
            total_tickets_sold: 0,
            total_amount_sold: 0,
            commissions_count: 0,
          })
        }

        const totals = staff_totals.get(staff_id)!
        totals.total_net_commission += commission.net_commission || 0
        totals.total_tickets_sold += commission.total_tickets_sold || 0
        totals.total_amount_sold += commission.total_amount_sold || 0
        totals.commissions_count += 1
      }

      return {
        commissions: commissions,
        staff_totals: Array.from(staff_totals.values()),
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener todas las comisiones')
    }
  }

  /**
   * Obtener comisiones agrupadas por partido (para admin)
   */
  public async get_commissions_by_game({ game_id }: { game_id: string }) {
    try {
      const commissions = await StaffCommissionHistoryModel.find({
        soccer_game_id: game_id,
      })
        .sort({ staff_name: 1 })
        .lean()

      // Calcular totales del partido
      const game_totals = {
        total_net_commission: commissions.reduce((sum, comm) => sum + (comm.net_commission || 0), 0),
        total_tickets_sold: commissions.reduce((sum, comm) => sum + (comm.total_tickets_sold || 0), 0),
        total_amount_sold: commissions.reduce((sum, comm) => sum + (comm.total_amount_sold || 0), 0),
        staff_count: commissions.length,
      }

      return {
        game_id: game_id,
        commissions: commissions,
        totals: game_totals,
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener las comisiones por partido')
    }
  }
}

