import { TicketModel } from '@/models/ticket.model'
import { ResponseError } from '@/utils/errors.util'
import { SoccerGameService } from './soccer_game.service'
import { UserService } from './user.service'
import { TicketStatus } from '@/contracts/types/ticket.type'
import { send_ticket_purchase_email, send_ticket_status_update_email } from '@/emails/email-main'
import { invalidateUserStatsCache, invalidateStaffStatsCache } from '@/config/redis.config'
import { StaffCommissionHistoryService } from './staff-commission-history.service'
import dayjs from 'dayjs'
import { SoccerTeamModel } from '@/models/soccer_team.model'
import { SoccerGameModel } from '@/models/soccer_games.model'
import { generate_auto_email, generate_random_password, generate_recover_code } from '@/utils/generate.util'

export class TicketService {
  // methods

  // GET

  public async get_ticket_by_id({ id }: { id: string }) {
    try {
      const ticket = await TicketModel.findById(id).lean()
      if (!ticket) throw new ResponseError(404, 'No se encontró la boleta')

      const game_service = new SoccerGameService()
      const user_service = new UserService()

      // Las tres consultas son independientes entre sí: ejecutarlas en paralelo
      const [curva_info, game_info, customer_info] = await Promise.all([
        game_service.get_curva_by_id({
          id: ticket.curva_id,
          game_id: ticket.soccer_game_id,
        }),
        game_service.get_soccer_game_by_id({ id: ticket.soccer_game_id, parse_ids: true }),
        user_service.get_user_by_id({ id: ticket.user_id }),
      ])

      return {
        ticket,
        game: game_info,
        curva: curva_info,
        customer: customer_info,
      }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener la boleta')
    }
  }

  public async get_my_last_ticket_by_user_id({ user_id }: { user_id: string }) {
    try {
      const ticket = await TicketModel.findOne({ user_id }).sort({ created_date: -1 }).lean()
      if (!ticket) throw new ResponseError(404, 'No se encontró la última boleta del usuario')
      return ticket
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener la última boleta del usuario')
    }
  }

  public async get_tickets_by_game_id({
    game_id,
    no_error,
  }: {
    game_id: string
    no_error?: boolean
  }) {
    try {
      const tickets = await TicketModel.find().where({ soccer_game_id: game_id }).lean()
      if (tickets.length === 0) {
        if (no_error) return []
        throw new ResponseError(404, 'No se encontraron boletas')
      }
      return tickets || []
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener las boletas')
    }
  }

  public async get_tickets_by_user_id({
    user_id,
    page = 1,
    limit = 20,
  }: {
    user_id: string
    page?: number
    limit?: number
  }) {
    try {
      const filter = { user_id }
      const skip = (page - 1) * limit

      const [tickets, total] = await Promise.all([
        TicketModel.find(filter).sort({ created_date: -1 }).skip(skip).limit(limit).lean(),
        TicketModel.countDocuments(filter),
      ])

      return { data: tickets, total }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener las boletas del usuario')
    }
  }

  public async get_tickets_by_curva_id({ curva_id }: { curva_id: string }) {
    try {
      const tickets = await TicketModel.find({ curva_id }).lean()
      if (!tickets) throw new ResponseError(404, 'No se encontraron boletas para esta curva')
      return tickets
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener las boletas de la curva')
    }
  }

  public async get_all_tickets({
    page = 1,
    limit = 20,
  }: {
    page?: number
    limit?: number
  } = {}) {
    try {
      const skip = (page - 1) * limit

      const [tickets, total] = await Promise.all([
        TicketModel.find().sort({ created_date: -1 }).skip(skip).limit(limit).lean(),
        TicketModel.countDocuments(),
      ])

      return { data: tickets, total }
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al obtener todas las boletas')
    }
  }

  // POST

  public async create_new_ticket({
    game_id,
    customer_id,
    curva_id,
    quantity,
    user,
    sell_by,
  }: {
    game_id: string
    customer_id?: string
    curva_id?: string
    quantity: number
    user?: {
      name: string
      phone?: string
    }
    sell_by?: string
  }) {
    try {
      const game_service = new SoccerGameService()
      const game_info = await game_service.get_soccer_game_by_id({ id: game_id, parse_ids: false })

      if (!user && !customer_id) throw new ResponseError(400, 'El usuario es requerido')

      const user_service = new UserService()
      let customer_info

      if (customer_id) {
        customer_info = await user_service.get_user_by_id({ id: customer_id })
      } else {
        // Generar email automáticamente
        const auto_email = generate_auto_email({ name: user?.name || 'usuario' })
        
        // Buscar por nombre y teléfono si están disponibles
        let try_find: any[] = []
        if (user?.name) {
          try_find = await user_service.get_users_by_param({ param: user.name })
          // Filtrar por teléfono si está disponible
          if (user.phone && try_find.length > 0) {
            try_find = try_find.filter((u) => u.phone === user.phone)
          }
        }
        
        if (try_find.length > 0) {
          customer_info = try_find[0]
        } else {
          customer_info = await user_service.create_new_user({
            name: user?.name || '',
            identity: {
              type_document: 'CC',
              number_document: generate_recover_code({ length: 10 }).toString(),
            },
            phone: user?.phone || '',
            role: 'customer',
            email: auto_email,
            password: generate_random_password({ length: 10 }),
          })
        }
      }

      // Acumulador para todos los resultados seleccionados (puede cruzar múltiples curvas)
      let selected_results: string[] = []
      let remaining_quantity = quantity
      let first_curva_id: string | null = null // Se establecerá en el primer bucle
      let tried_specified_curva = false // Para priorizar la curva indicada sólo una vez

      // Si se especifica una curva_id, validar que existe (pero no requerir que tenga suficientes resultados)
      if (curva_id) {
        const curva_exist = game_info.curvas_open.find((curva: any) => curva.id === curva_id)
        if (!curva_exist) {
          throw new ResponseError(404, 'No se encontró la curva especificada')
        }
        // No lanzar error si no tiene suficientes resultados, el bucle while lo manejará
      }

      // Cota de seguridad para evitar bucles infinitos ante alta concurrencia / agotamiento
      let safety_counter = 0
      const SAFETY_MAX = quantity * 50 + 200

      // Bucle de compra: reclama un número a la vez de forma ATÓMICA, abriendo nuevas curvas si hace falta.
      // Cada reclamo es atómico (ver SoccerGameService.claim_random_result_atomic), por lo que dos compras
      // concurrentes no pueden quedarse con el mismo número.
      while (remaining_quantity > 0) {
        safety_counter++
        if (safety_counter > SAFETY_MAX) {
          throw new ResponseError(
            500,
            'No se pudieron asignar todos los resultados (agotamiento o concurrencia muy alta)'
          )
        }

        // Lectura ligera de las curvas más recientes (sólo el campo necesario, sin joins de equipos/torneo)
        const current_game = await SoccerGameModel.findById(game_id).select('curvas_open').lean()
        if (!current_game) throw new ResponseError(404, 'No se encontró el partido de futbol')

        // Elegir la curva objetivo
        let target_curva: any = null

        // En el primer intento, si se especificó una curva y aún tiene cupo, priorizarla
        if (!tried_specified_curva && curva_id) {
          target_curva = current_game.curvas_open.find(
            (c: any) => c.id === curva_id && c.status === 'open' && c.avaliable_results.length > 0
          )
          tried_specified_curva = true
        }

        // Si no, buscar cualquier curva abierta con resultados disponibles
        if (!target_curva) {
          target_curva = current_game.curvas_open.find(
            (c: any) => c.status === 'open' && c.avaliable_results.length > 0
          )
        }

        // Si no hay ninguna curva disponible, abrir una nueva y reintentar
        if (!target_curva) {
          const new_curva_result = await game_service.open_new_curva({ game_id })
          if (!new_curva_result.status || !new_curva_result.curva) {
            throw new ResponseError(500, 'Error al abrir nueva curva')
          }
          continue
        }

        // Reclamar UN resultado de forma atómica de la curva objetivo
        const claimed = await game_service.claim_random_result_atomic({
          game_id,
          curva_id: target_curva.id,
        })

        if (!claimed) {
          // La curva se agotó (por concurrencia u otra compra): reintentar con otra curva
          continue
        }

        selected_results.push(claimed)
        if (first_curva_id === null) first_curva_id = target_curva.id
        remaining_quantity -= 1
      }

      const payed_amount = game_info.soccer_price * quantity

      const ticket_number = await this.generate_ticket_number()

      // Convertir sell_by a string si existe para asegurar consistencia
      const sell_by_str = sell_by ? String(sell_by) : undefined

      // Validar que tenemos una curva_id antes de crear el ticket
      if (!first_curva_id) {
        throw new ResponseError(500, 'Error: No se pudo determinar la curva para el ticket')
      }

      // Crear un solo ticket con todos los resultados (pueden venir de múltiples curvas)
      await TicketModel.create({
        ticket_number: ticket_number,
        soccer_game_id: game_id,
        user_id: customer_info._id,
        results_purchased: selected_results,
        payed_amount: payed_amount,
        status: 'pending',
        curva_id: first_curva_id, // Usar la primera curva como referencia
        created_date: new Date(),
        sell_by: sell_by_str,
        reward_amount: game_info.soccer_reward,
      })

      // Invalidar cache de stats del usuario y staff (si existe)
      await invalidateUserStatsCache(String(customer_info._id))
      if (sell_by_str) {
        await invalidateStaffStatsCache(sell_by_str)
      }

      // Actualizar comisión del staff en tiempo real (solo para ventas físicas)
      if (sell_by_str) {
        try {
          const commission_service = new StaffCommissionHistoryService()
          await commission_service.update_commission_for_ticket({
            game_id: game_id,
            staff_id: sell_by_str,
          })
        } catch (commission_error) {
          // No fallar la creación del ticket si hay error en comisiones
          console.error(`⚠️ Error actualizando comisión para staff ${sell_by_str}:`, commission_error)
        }
      }

      const teamOne = await SoccerTeamModel.findById(game_info.soccer_teams[0])
      if (!teamOne) throw new ResponseError(404, 'No se encontró el equipo')

      const teamTwo = await SoccerTeamModel.findById(game_info.soccer_teams[1])
      if (!teamTwo) throw new ResponseError(404, 'No se encontró el equipo')

      // Obtener el nombre del torneo
      const TournamentModel = (await import('@/models/tournament.model')).TournamentModel
      const tournament = await TournamentModel.findById(game_info.tournament).lean()
      const tournament_name = tournament ? tournament.name : game_info.tournament

      await send_ticket_purchase_email({
        user_name: customer_info.name,
        user_email: customer_info.email,
        ticket_number: ticket_number,
        game_info: {
          team1: teamOne.name,
          team2: teamTwo.name,
          date: dayjs(game_info.start_date).format('DD/MM/YYYY hh:mm A'),
          tournament: tournament_name,
        },
        results_purchased: selected_results,
        total_amount: payed_amount,
      })

      // Devolver el ticket creado
      return {
        ticket_number: ticket_number,
        soccer_game_id: game_id,
        user_id: customer_info._id,
        results_purchased: selected_results,
        payed_amount: payed_amount,
        status: 'pending',
        curva_id: first_curva_id || '',
        created_date: new Date(),
      }
    } catch (err) {
      console.error('❌ [TicketService] Error en create_new_ticket:', err)
      if (err instanceof ResponseError) {
        console.error(`❌ [TicketService] ResponseError: ${err.message} (${err.statusCode})`)
        throw err
      }
      console.error('❌ [TicketService] Error desconocido:', err)
      throw new ResponseError(
        500,
        `Error al crear la boleta: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  public async change_ticket_status({
    ticket_id,
    status,
    force = false, // Permite forzar actualización si el ticket ya está cerrado
  }: {
    ticket_id: string
    status: TicketStatus
    force?: boolean
  }) {
    try {
      const ticket = await TicketModel.findById(ticket_id)
      if (!ticket) throw new ResponseError(404, 'No se encontró la boleta')

      // Si el ticket ya está cerrado y no es forzado, verificar si el estado es el mismo
      if (ticket.close && !force) {
        // Si ya tiene el mismo estado, no hacer nada
        if (ticket.status === status) {
          return {
            ticket_number: ticket.ticket_number,
            soccer_game_id: ticket.soccer_game_id,
            user_id: ticket.user_id,
            results_purchased: ticket.results_purchased,
            payed_amount: ticket.payed_amount,
            status: ticket.status,
            curva_id: ticket.curva_id,
            created_date: ticket.created_date,
          }
        }
        // Si tiene un estado diferente y no es forzado, lanzar error
        throw new ResponseError(404, 'La boleta ya está cerrada')
      }

      const old_status = ticket.status
      ticket.status = status
      ticket.close = true
      await ticket.save()

      // Invalidar cache de stats del usuario y staff (si existe)
      await invalidateUserStatsCache(String(ticket.user_id))
      if (ticket.sell_by) {
        await invalidateStaffStatsCache(String(ticket.sell_by))
      }

      // Obtener información del usuario y del juego para el email
      const user_service = new UserService()
      const game_service = new SoccerGameService()

      const customer_info = await user_service.get_user_by_id({ id: ticket.user_id })
      const game_info = await game_service.get_soccer_game_by_id({ id: ticket.soccer_game_id, parse_ids: true })

      // Enviar correo de actualización de estado
      await send_ticket_status_update_email({
        user_name: customer_info.name,
        user_email: customer_info.email,
        ticket_number: ticket.ticket_number,
        old_status: old_status,
        new_status: status,
        game_info: {
          team1: game_info.soccer_teams[0] as string,
          team2: game_info.soccer_teams[1] as string,
          date: dayjs(game_info.start_date).format('DD/MM/YYYY hh:mm A'),
        },
      })
    } catch (err) {
      if (err instanceof ResponseError) throw err
      throw new ResponseError(500, 'Error al cambiar el estado de la boleta')
    }
  }

  // private methods

  private async generate_ticket_number(): Promise<number> {
    try {
      const last_ticket = await TicketModel.findOne()
        .select('ticket_number')
        .sort({ created_date: -1 })
        .lean()
      if (!last_ticket) return 1000
      return last_ticket.ticket_number + 1
    } catch (error) {
      if (error instanceof ResponseError) throw error
      throw new ResponseError(500, 'Error al generar el numero de boleta')
    }
  }
}
