import { StaffCommissionHistoryModel } from '@/models/staff-commission-history.model'
import { TicketModel } from '@/models/ticket.model'
import { UserModel } from '@/models/user.model'
import { ResponseError } from '@/utils/errors.util'

export class StaffCommissionHistoryService {
  // Constantes de comisión
  private readonly STAFF_COMMISSION_PERCENTAGE = 21.5 // Porcentaje de comisión del staff
  private readonly STAFF_FIXED_BONUS = 700 // Bono fijo del staff por boleta
  private readonly WOMPI_COMMISSION_PERCENTAGE = 2.65 // Porcentaje variable de Wompi
  private readonly WOMPI_FIXED_COST = 700 // Costo fijo de Wompi
  private readonly IVA_PERCENTAGE = 19 // IVA sobre la comisión de Wompi

  /**
   * Actualizar comisión de un staff cuando se crea una nueva boleta física
   * Este método recalcula la comisión basándose en todas las boletas físicas del staff en el partido
   */
  public async update_commission_for_ticket({
    game_id,
    staff_id,
  }: {
    game_id: string
    staff_id: string
  }) {
    try {
      // Solo procesar si es una venta física (tiene sell_by)
      if (!staff_id) {
        return { message: 'No es una venta física, no se calcula comisión' }
      }

      // Obtener todas las boletas físicas vendidas por este staff en este partido
      const physical_tickets = await TicketModel.find({
        soccer_game_id: game_id,
        sell_by: staff_id,
        $or: [
          { wompi_transaction_id: { $exists: false } },
          { wompi_transaction_id: null },
        ],
      }).lean()

      if (physical_tickets.length === 0) {
        // No hay boletas físicas, eliminar registro si existe
        await StaffCommissionHistoryModel.deleteOne({
          staff_id: staff_id,
          soccer_game_id: game_id,
        })
        return { message: 'No hay boletas físicas, registro eliminado si existía' }
      }

      // Obtener información del staff
      const staff = await UserModel.findById(staff_id).lean()
      if (!staff) {
        console.warn(`⚠️ Staff con ID ${staff_id} no encontrado, saltando cálculo de comisiones`)
        return { message: 'Staff no encontrado' }
      }

      // Calcular totales
      const total_tickets_sold = physical_tickets.length
      const total_amount_sold = physical_tickets.reduce(
        (sum, ticket) => sum + (Number(ticket.payed_amount) || 0),
        0
      )

      // Calcular comisiones por iteración/resultado
      // La comisión se calcula por cada resultado individual: (monto × 21.5%) + $700
      let total_commission_amount = 0
      for (const ticket of physical_tickets) {
        const payed_amount = Number(ticket.payed_amount) || 0
        const results_count = Array.isArray(ticket.results_purchased) 
          ? ticket.results_purchased.length 
          : 1
        
        // Precio por resultado
        const price_per_result = results_count > 0 ? payed_amount / results_count : payed_amount
        
        // Comisión por resultado: (precio × 21.5%) + $700
        const commission_per_result = (price_per_result * this.STAFF_COMMISSION_PERCENTAGE) / 100 + this.STAFF_FIXED_BONUS
        
        // Comisión total de esta boleta (por cada iteración/resultado)
        const ticket_commission = commission_per_result * results_count
        
        total_commission_amount += ticket_commission
      }

      // Comisión neta (ya incluye el bono fijo)
      const commission_amount = total_commission_amount
      const net_commission = commission_amount
      
      // Calcular comisión de Wompi por iteración/resultado: 2.65% + $700 + IVA 19% sobre (2.65% + 700)
      // Por cada resultado: (precio_por_resultado × 2.65%) + 700, luego IVA 19% sobre ese subtotal
      let total_wompi_commission = 0
      for (const ticket of physical_tickets) {
        const payed_amount = Number(ticket.payed_amount) || 0
        const results_count = Array.isArray(ticket.results_purchased) 
          ? ticket.results_purchased.length 
          : 1
        
        // Precio por resultado
        const price_per_result = results_count > 0 ? payed_amount / results_count : payed_amount
        
        // Calcular comisión de Wompi por cada resultado
        for (let i = 0; i < results_count; i++) {
          // Comisión variable de Wompi (2.65%) por resultado
          const wompi_variable = (price_per_result * this.WOMPI_COMMISSION_PERCENTAGE) / 100
          // Subtotal antes de IVA: comisión variable + costo fijo
          const wompi_subtotal = wompi_variable + this.WOMPI_FIXED_COST
          // IVA sobre el subtotal
          const wompi_iva = (wompi_subtotal * this.IVA_PERCENTAGE) / 100
          // Comisión total de Wompi para este resultado
          const wompi_total = wompi_subtotal + wompi_iva
          total_wompi_commission += wompi_total
        }
      }
      const wompi_commission_amount = total_wompi_commission

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
        existing_commission.total_transaction_costs = total_tickets_sold * this.STAFF_FIXED_BONUS // Solo para referencia
        existing_commission.net_commission = net_commission
        existing_commission.wompi_commission_percentage = this.WOMPI_COMMISSION_PERCENTAGE
        existing_commission.wompi_fixed_cost = this.WOMPI_FIXED_COST
        existing_commission.wompi_iva_percentage = this.IVA_PERCENTAGE
        existing_commission.wompi_commission_amount = wompi_commission_amount
        await existing_commission.save()
        return { message: 'Comisión actualizada', commission: existing_commission.toObject() }
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
          transaction_cost: this.STAFF_FIXED_BONUS,
          total_transaction_costs: total_tickets_sold * this.STAFF_FIXED_BONUS, // Solo para referencia
          net_commission: net_commission,
          wompi_commission_percentage: this.WOMPI_COMMISSION_PERCENTAGE,
          wompi_fixed_cost: this.WOMPI_FIXED_COST,
          wompi_iva_percentage: this.IVA_PERCENTAGE,
          wompi_commission_amount: wompi_commission_amount,
          game_finished_at: new Date(), // Se actualizará cuando finalice el partido
        })
        return { message: 'Comisión creada', commission: commission_history.toObject() }
      }
    } catch (err) {
      console.error('❌ [StaffCommissionHistoryService] Error actualizando comisión:', err)
      // No lanzar error para no interrumpir la creación del ticket
      return { message: 'Error al actualizar comisión (no crítico)', error: err }
    }
  }

  /**
   * Calcular y guardar comisiones de todos los staff para un partido finalizado
   * (Método mantenido para compatibilidad, pero ya no se usa en tiempo real)
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

        // Calcular comisiones por iteración/resultado
        // La comisión se calcula por cada resultado individual: (monto × 21.5%) + $700
        let total_commission_amount = 0
        for (const ticket of tickets) {
          const payed_amount = Number(ticket.payed_amount) || 0
          const results_count = Array.isArray(ticket.results_purchased) 
            ? ticket.results_purchased.length 
            : 1
          
          // Precio por resultado
          const price_per_result = results_count > 0 ? payed_amount / results_count : payed_amount
          
          // Comisión por resultado: (precio × 21.5%) + $700
          const commission_per_result = (price_per_result * this.STAFF_COMMISSION_PERCENTAGE) / 100 + this.STAFF_FIXED_BONUS
          
          // Comisión total de esta boleta (por cada iteración/resultado)
          const ticket_commission = commission_per_result * results_count
          
          total_commission_amount += ticket_commission
        }

        // Comisión neta (ya incluye el bono fijo)
        const commission_amount = total_commission_amount
        const net_commission = commission_amount
        
        // Calcular comisión de Wompi por iteración/resultado: 2.65% + $700 + IVA 19% sobre (2.65% + 700)
        // Por cada resultado: (precio_por_resultado × 2.65%) + 700, luego IVA 19% sobre ese subtotal
        let total_wompi_commission = 0
        for (const ticket of tickets) {
          const payed_amount = Number(ticket.payed_amount) || 0
          const results_count = Array.isArray(ticket.results_purchased) 
            ? ticket.results_purchased.length 
            : 1
          
          // Precio por resultado
          const price_per_result = results_count > 0 ? payed_amount / results_count : payed_amount
          
          // Calcular comisión de Wompi por cada resultado
          for (let i = 0; i < results_count; i++) {
            // Comisión variable de Wompi (2.65%) por resultado
            const wompi_variable = (price_per_result * this.WOMPI_COMMISSION_PERCENTAGE) / 100
            // Subtotal antes de IVA: comisión variable + costo fijo
            const wompi_subtotal = wompi_variable + this.WOMPI_FIXED_COST
            // IVA sobre el subtotal
            const wompi_iva = (wompi_subtotal * this.IVA_PERCENTAGE) / 100
            // Comisión total de Wompi para este resultado
            const wompi_total = wompi_subtotal + wompi_iva
            total_wompi_commission += wompi_total
          }
        }
        const wompi_commission_amount = total_wompi_commission

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
          existing_commission.total_transaction_costs = total_tickets_sold * this.STAFF_FIXED_BONUS // Solo para referencia
          existing_commission.net_commission = net_commission
          existing_commission.wompi_commission_percentage = this.WOMPI_COMMISSION_PERCENTAGE
          existing_commission.wompi_fixed_cost = this.WOMPI_FIXED_COST
          existing_commission.wompi_iva_percentage = this.IVA_PERCENTAGE
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
            transaction_cost: this.STAFF_FIXED_BONUS,
            total_transaction_costs: total_tickets_sold * this.STAFF_FIXED_BONUS, // Solo para referencia
            net_commission: net_commission,
            wompi_commission_percentage: this.WOMPI_COMMISSION_PERCENTAGE,
            wompi_fixed_cost: this.WOMPI_FIXED_COST,
            wompi_iva_percentage: this.IVA_PERCENTAGE,
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
   * Actualizar game_finished_at en los registros de comisiones cuando se finaliza un partido
   */
  public async update_game_finished_at({
    game_id,
    game_finished_at,
  }: {
    game_id: string
    game_finished_at: Date
  }) {
    try {
      await StaffCommissionHistoryModel.updateMany(
        { soccer_game_id: game_id },
        { game_finished_at: game_finished_at }
      )
      return { message: 'Fecha de finalización actualizada en comisiones' }
    } catch (err) {
      console.error('❌ [StaffCommissionHistoryService] Error actualizando game_finished_at:', err)
      throw new ResponseError(500, 'Error al actualizar fecha de finalización')
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

