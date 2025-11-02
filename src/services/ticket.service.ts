import { TicketModel } from '@/models/ticket.model'
import { ResponseError } from '@/utils/errors.util'
import { SoccerGameService } from './soccer_game.service'
import { UserService } from './user.service'
import { TicketStatus } from '@/contracts/types/ticket.type'
import { send_ticket_purchase_email, send_ticket_status_update_email } from '@/emails/email-main'
import { invalidateUserStatsCache, invalidateStaffStatsCache } from '@/config/redis.config'
import dayjs from 'dayjs'
import { SoccerTeamModel } from '@/models/soccer_team.model'

export class TicketService {
  // methods

  // GET

  public async get_ticket_by_id({ id }: { id: string }) {
    try {
      const ticket = await TicketModel.findById(id).lean()
      if (!ticket) throw new ResponseError(404, 'No se encontró la boleta')

      const game_service = new SoccerGameService()
      const curva_info = await game_service.get_curva_by_id({
        id: ticket.curva_id,
        game_id: ticket.soccer_game_id,
      })

      const game_info = await game_service.get_soccer_game_by_id({ id: ticket.soccer_game_id })

      const user_service = new UserService()
      const customer_info = await user_service.get_user_by_id({ id: ticket.user_id })

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

  public async get_tickets_by_user_id({ user_id }: { user_id: string }) {
    try {
      const tickets = await TicketModel.find({ user_id }).lean()
      if (!tickets) throw new ResponseError(404, 'No se encontraron boletas para este usuario')
      return tickets
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

  public async get_all_tickets() {
    try {
      const tickets = await TicketModel.find().lean()
      if (!tickets) throw new ResponseError(404, 'No se encontraron boletas')
      return tickets
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
      email: string
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
        let try_find = await user_service.get_users_by_param({ param: user?.email || '' })
        if (try_find.length > 0) {
          customer_info = try_find[0]
        } else {
          customer_info = await user_service.create_new_user({
            name: user?.name || '',
            identity: {
              type_document: 'CC',
              number_document: 'W',
            },
            phone: user?.phone || '',
            role: 'customer',
            email: user?.email || '',
            password: '1',
          })
        }
      }

      // Acumulador para todos los resultados seleccionados (puede cruzar múltiples curvas)
      let selected_results: string[] = []
      let remaining_quantity = quantity
      let first_curva_id: string | null = null // Se establecerá en el primer bucle
      
      // Si se especifica una curva_id, validar que existe (pero no requerir que tenga suficientes resultados)
      if (curva_id) {
        const curva_exist = game_info.curvas_open.find((curva) => curva.id === curva_id)
        if (!curva_exist) {
          throw new ResponseError(404, 'No se encontró la curva especificada')
        }
        // No lanzar error si no tiene suficientes resultados, el bucle while lo manejará
      }

      // Bucle para comprar todos los tickets, abriendo nuevas curvas si es necesario
      while (remaining_quantity > 0) {
        // Obtener el juego actualizado para tener las curvas más recientes
        const current_game_info = await game_service.get_soccer_game_by_id({ 
          id: game_id, 
          parse_ids: false 
        })

        // Encontrar una curva disponible con resultados suficientes
        let current_curva = current_game_info.curvas_open.find(
          (curva) => curva.status === 'open' && curva.avaliable_results.length > 0
        )

        // Si no hay curva disponible, crear una nueva
        if (!current_curva) {
          const new_curva_result = await game_service.open_new_curva({ game_id })
          if (!new_curva_result.status || !new_curva_result.curva) {
            throw new ResponseError(500, 'Error al abrir nueva curva')
          }
          
          // Obtener el juego actualizado nuevamente después de abrir la curva
          const updated_game_info = await game_service.get_soccer_game_by_id({ 
            id: game_id, 
            parse_ids: false 
          })
          
          current_curva = updated_game_info.curvas_open.find(
            (curva) => curva.id === new_curva_result.curva.id
          )
          
          if (!current_curva) {
            throw new ResponseError(500, 'No se pudo encontrar la nueva curva creada')
          }
        }
        
        // Si es la primera iteración y se especificó una curva_id, usar esa curva primero si está disponible
        if (first_curva_id === null && curva_id) {
          const specified_curva = current_game_info.curvas_open.find(
            (curva) => curva.id === curva_id && curva.status === 'open' && curva.avaliable_results.length > 0
          )
          if (specified_curva) {
            current_curva = specified_curva
          }
        }
        
        // Guardar la primera curva_id para el ticket
        if (first_curva_id === null) {
          first_curva_id = current_curva.id
        }

        // Validar que la curva tenga id
        if (!current_curva.id) {
          console.error(`❌ [TicketService] La curva no tiene id. Curva completa:`, current_curva)
          throw new ResponseError(500, 'La curva no tiene un ID válido')
        }

        // Validar que la curva tenga resultados disponibles
        if (!current_curva.avaliable_results || !Array.isArray(current_curva.avaliable_results)) {
          console.error(`❌ [TicketService] Curva ${current_curva.id} no tiene avaliable_results válidos`)
          throw new ResponseError(500, `La curva ${current_curva.id} no tiene resultados disponibles válidos`)
        }

        // Calcular cuántos tickets podemos comprar de esta curva
        const available_in_curva = current_curva.avaliable_results.length
        const tickets_to_buy_from_curva = Math.min(remaining_quantity, available_in_curva)

        // Comprar los tickets de esta curva
        // Crear copias profundas de los arrays para evitar mutaciones
        // Asegurarse de copiar explícitamente el id y status
        const updated_curva = {
          id: current_curva.id, // Mantener el id original
          status: current_curva.status || 'open',
          avaliable_results: [...(current_curva.avaliable_results || [])],
          sold_results: [...(current_curva.sold_results || [])],
        }

        for (let i = 0; i < tickets_to_buy_from_curva; i++) {
          // Validar que aún hay resultados disponibles
          if (!updated_curva.avaliable_results || updated_curva.avaliable_results.length === 0) {
            console.warn(`⚠️ [TicketService] No hay más resultados disponibles en la curva ${updated_curva.id}`)
            break
          }

          const random_result =
            updated_curva.avaliable_results[
              Math.floor(Math.random() * updated_curva.avaliable_results.length)
            ]
          
          selected_results.push(random_result)

          // Remover el resultado de disponibles y agregarlo a vendidos
          updated_curva.avaliable_results = updated_curva.avaliable_results.filter(
            (result) => result !== random_result
          )
          updated_curva.sold_results.push(random_result)
        }

        // Si la curva se agotó, marcarla como sold_out
        if (updated_curva.avaliable_results.length === 0) {
          updated_curva.status = 'sold_out'
        }

        // Actualizar la curva en la base de datos
        try {
          await game_service.update_curva_results({
            game_id,
            curva_id: updated_curva.id,
            curva_updated: updated_curva as any, // Cast para compatibilidad con UUID type
          })
        } catch (curvaError) {
          console.error(`❌ [TicketService] Error actualizando curva ${updated_curva.id}:`, curvaError)
          throw curvaError
        }

        // Reducir la cantidad restante
        remaining_quantity -= tickets_to_buy_from_curva
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

      const teamOne = await SoccerTeamModel.findById(game_info.soccer_teams[0])
      if (!teamOne) throw new ResponseError(404, 'No se encontró el equipo')

      const teamTwo = await SoccerTeamModel.findById(game_info.soccer_teams[1])
      if (!teamTwo) throw new ResponseError(404, 'No se encontró el equipo')

      await send_ticket_purchase_email({
        user_name: customer_info.name,
        user_email: customer_info.email,
        ticket_number: ticket_number,
        game_info: {
          team1: teamOne.name,
          team2: teamTwo.name,
          date: dayjs(game_info.start_date).format('DD/MM/YYYY hh:mm A'),
          tournament: game_info.tournament,
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
      throw new ResponseError(500, `Error al crear la boleta: ${err instanceof Error ? err.message : String(err)}`)
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
      const game_info = await game_service.get_soccer_game_by_id({ id: ticket.soccer_game_id })

      // Enviar correo de actualización de estado
      await send_ticket_status_update_email({
        user_name: customer_info.name,
        user_email: customer_info.email,
        ticket_number: ticket.ticket_number,
        old_status: old_status,
        new_status: status,
        game_info: {
          team1: game_info.soccer_teams[0],
          team2: game_info.soccer_teams[1],
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
