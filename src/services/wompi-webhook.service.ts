import { TicketService } from './ticket.service'
import { TicketModel } from '@/models/ticket.model'
import { TransactionHistoryModel } from '@/models/transaction-history.model'
import { send_ticket_purchase_email } from '@/emails/email-main'
import { io_server } from '@/server_config'
import { GAME_EVENTS } from '@/events/game_events'

export class WompiWebhookService {
  private ticketService = new TicketService()

  /**
   * Procesar actualización de transacción
   */
  async processTransactionUpdate(transactionData: any): Promise<void> {
    // Los datos están dentro de transactionData.transaction
    const transaction = transactionData.transaction
    const { id, status, reference, customer_email } = transaction

    try {
      // ⚠️ PREVENIR PROCESAMIENTO DUPLICADO
      // Verificar si ya existe un ticket con esta referencia de pago
      const existingTicket = await TicketModel.findOne({ 
        payment_reference: reference,
        payment_status: status
      })

      if (existingTicket) {
        console.log(`⏭️ Webhook duplicado ignorado - Ticket ya procesado: ${reference} con status ${status}`)
        return // Ya fue procesado, no hacer nada
      }

      // Si el pago es aprobado, crear el ticket
      if (status === 'APPROVED') {
        // Parsear el reference para extraer userId, gameId y quantity
        // Formato: TGS_{userId}_{gameId}_Q{quantity}_{timestamp}_{random}
        // Ejemplo: TGS_64f8a1b2c3d4e5f6a7b8c9d0_68fc4ecf1cda29838ddcd4b3_Q03_1761685874654_abc123def
        let userId: string | undefined
        let gameId: string | undefined
        let quantity: number = 1
        
        try {
          if (reference && reference.startsWith('TGS_')) {
            const parts = reference.split('_')
            
            console.log(`📋 Parseando reference: ${reference}`)
            console.log(`📋 Parts separados:`, parts)
            
            // TGS_{userId}_{gameId}_Q{quantity}_{timestamp}_{random}
            // parts[0] = "TGS"
            // parts[1] = userId
            // parts[2] = gameId
            // parts[3] = "Q{quantity}"
            
            if (parts.length >= 4) {
              userId = parts[1]
              gameId = parts[2]
              
              // Extraer quantity de parts[3] (formato: "Q03" -> 3, "Q81" -> 81)
              if (parts[3] && parts[3].startsWith('Q')) {
                const quantityStr = parts[3].substring(1) // Remover el "Q"
                const parsedQuantity = parseInt(quantityStr, 10)
                
                // Validar que el parseo fue exitoso y es un número válido
                if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
                  quantity = parsedQuantity
                } else {
                  console.warn(`⚠️ Cantidad inválida parseada: "${quantityStr}", usando default: 1`)
                }
                
                console.log(`📊 Cantidad parseada: ${quantity} (de "${parts[3]}")`)
              } else {
                console.warn(`⚠️ Parts[3] no inicia con 'Q': "${parts[3]}"`)
              }
            } else {
              console.warn(`⚠️ Reference no tiene suficientes parts. Esperado >= 4, obtenido: ${parts.length}`)
            }
          } else {
            console.warn(`⚠️ Reference no inicia con 'TGS_': ${reference}`)
          }
        } catch (error) {
          console.error('❌ Error parseando reference:', error)
          console.error('Reference recibido:', reference)
        }
        
        // Verificar que tenemos los datos necesarios
        if (!gameId || !userId) {
          console.error('❌ No se pudo extraer gameId o userId del reference:', reference)
          return
        }
        
        console.log(`✅ Datos parseados - userId: ${userId}, gameId: ${gameId}, quantity: ${quantity}`)

        try {
          console.log(`🎫 Creando ticket - game_id: ${gameId}, customer_id: ${userId}, quantity: ${quantity}`)
          
          // Crear el ticket usando el servicio con los datos parseados del reference
          const ticketData = await this.ticketService.create_new_ticket({
            game_id: gameId,
            customer_id: userId,
            quantity: quantity,
            user: customer_email ? {
              name: transaction.customer_data?.full_name || 'Cliente',
              email: customer_email
            } : undefined
          })
          
          console.log(`✅ Ticket creado - ticket_number: ${ticketData.ticket_number}, resultados: ${ticketData.results_purchased?.length || 0}`)

          // Obtener el ticket actualizado
          const updatedTicket = await TicketModel.findOneAndUpdate(
            { ticket_number: ticketData.ticket_number },
            {
              payment_reference: reference,
              wompi_transaction_id: id,
              payment_status: status,
              payment_finalized_at: transaction.finalized_at 
                ? new Date(transaction.finalized_at) 
                : new Date(),
              customer_email: customer_email
            },
            { new: true }
          )

          // Guardar en el historial de transacciones
          if (updatedTicket) {
            await this.saveTransactionHistory({
              ticket: updatedTicket,
              transaction: transaction,
              customer_email: customer_email,
              customer_name: transaction.customer_data?.full_name
            })
          }

          // Emitir broadcast de socket para notificar la venta del ticket
          io_server.emit(GAME_EVENTS.TICKET_BROADCAST, {
            game_id: gameId,
            curva_id: ticketData.curva_id,
            quantity: quantity,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error('Error creando ticket:', error)
        }
      } else if (status === 'DECLINED') {
        // Aquí podrías implementar lógica para notificar al usuario sobre el rechazo
      }

    } catch (error) {
      console.error('Error procesando actualización de transacción:', error)
      throw error
    }
  }

  /**
   * Procesar nueva transacción
   */
  async processTransactionCreated(transactionData: any): Promise<void> {
    const { id, status, reference } = transactionData

    try {
      // Buscar ticket por referencia
      const ticket = await TicketModel.findOne({
        payment_reference: reference,
      })

      if (!ticket) {
        console.error(`Ticket no encontrado para referencia: ${reference}`)
        return
      }

      // Actualizar con datos iniciales
      ticket.payment_status = status
      ticket.wompi_transaction_id = id
      ticket.payment_created_at = new Date(transactionData.created_at)

      await ticket.save()
    } catch (error) {
      console.error('Error procesando transacción creada:', error)
      throw error
    }
  }

  /**
   * Manejar transacciones aprobadas
   */
  async processTransactionApproved(transactionData: any): Promise<void> {
    try {
      const { reference, customer_email, metadata } = transactionData

      // 1. Buscar la transacción en la base de datos
      const ticket = await TicketModel.findOne({ payment_reference: reference })
      if (!ticket) {
        console.error('Ticket no encontrado:', reference)
        return
      }

      // 2. Actualizar estado a aprobada
      ticket.payment_status = 'APPROVED'
      ticket.wompi_transaction_id = transactionData.id
      ticket.customer_email = customer_email
      ticket.status = 'pending' // Activar el ticket

      await ticket.save()

      // Guardar en el historial de transacciones
      await this.saveTransactionHistory({
        ticket: ticket,
        transaction: transactionData,
        customer_email: customer_email,
        customer_name: transactionData.customer_data?.full_name
      })

      // 3. Crear los tickets para el usuario usando los servicios
      if (metadata && metadata.userId && metadata.gameId) {
        await this.createTicketsForUser(metadata.userId, metadata.gameId, ticket.results_purchased.length)
      }

      // 4. Enviar notificación al usuario
      await this.sendPaymentConfirmationEmail(ticket)
    } catch (error) {
      console.error('Error procesando transacción aprobada:', error)
      throw error
    }
  }

  /**
   * Manejar transacciones rechazadas
   */
  async processTransactionDeclined(transactionData: any): Promise<void> {
    try {
      const { reference, metadata } = transactionData

      // 1. Buscar la transacción
      const ticket = await TicketModel.findOne({ payment_reference: reference })
      if (!ticket) {
        console.error('Ticket no encontrado:', reference)
        return
      }

      // 2. Actualizar estado a rechazada
      ticket.payment_status = 'DECLINED'
      ticket.status = 'lost' // Marcar como perdido

      await ticket.save()

      // Guardar en el historial de transacciones (también las rechazadas)
      await this.saveTransactionHistory({
        ticket: ticket,
        transaction: transactionData,
        customer_email: transactionData.customer_email,
        customer_name: transactionData.customer_data?.full_name
      })

      // 3. Liberar los tickets reservados
      if (metadata && metadata.gameId) {
        await this.releaseReservedTickets(metadata.gameId, ticket.results_purchased.length)
      }
    } catch (error) {
      console.error('Error procesando transacción rechazada:', error)
      throw error
    }
  }

  /**
   * Enviar email de confirmación de pago
   */
  private async sendPaymentConfirmationEmail(ticket: any): Promise<void> {
    try {
      // Obtener información del juego
      const game = await this.ticketService.get_ticket_by_id({ id: ticket._id })

      if (game && game.game) {
        await send_ticket_purchase_email({
          user_name: ticket.customer_name || 'Cliente',
          user_email: ticket.customer_email || '',
          ticket_number: ticket.ticket_number,
          game_info: {
            team1: game.game.soccer_teams[0],
            team2: game.game.soccer_teams[1],
            date: game.game.start_date.toISOString(),
            tournament: game.game.tournament,
          },
          results_purchased: ticket.results_purchased,
          total_amount: ticket.payed_amount,
        })
      }
    } catch (error) {
      console.error('Error enviando email de confirmación:', error)
    }
  }


  /**
   * Crear tickets para el usuario
   */
  private async createTicketsForUser(userId: string, gameId: string, quantity: number): Promise<void> {
    try {
      // Usar el servicio de tickets para crear los tickets
      await this.ticketService.create_new_ticket({
        game_id: gameId,
        customer_id: userId,
        quantity: quantity,
      })
    } catch (error) {
      console.error('Error creando tickets para usuario:', error)
      throw error
    }
  }

  /**
   * Liberar tickets reservados
   */
  private async releaseReservedTickets(gameId: string, quantity: number): Promise<void> {
    try {
      // Aquí podrías implementar la lógica para liberar tickets reservados
      // Por ejemplo, actualizar el estado de las curvas para liberar los resultados
    } catch (error) {
      console.error('Error liberando tickets reservados:', error)
      throw error
    }
  }

  /**
   * Guardar transacción en el historial
   */
  private async saveTransactionHistory({
    ticket,
    transaction,
    customer_email,
    customer_name,
  }: {
    ticket: any
    transaction: any
    customer_email?: string
    customer_name?: string
  }): Promise<void> {
    try {
      // Verificar si ya existe un registro con la misma referencia de transacción
      const existingHistory = await TransactionHistoryModel.findOne({
        wompi_transaction_id: ticket.wompi_transaction_id || transaction.id,
      })

      if (existingHistory) {
        // Actualizar el registro existente
        existingHistory.payment_status = ticket.payment_status || transaction.status
        existingHistory.successful_purchase = ticket.payment_status === 'APPROVED'
        existingHistory.finalized_at = ticket.payment_finalized_at 
          ? new Date(ticket.payment_finalized_at) 
          : (transaction.finalized_at ? new Date(transaction.finalized_at) : new Date())
        
        if (customer_email) existingHistory.customer_email = customer_email
        if (customer_name) existingHistory.customer_name = customer_name

        await existingHistory.save()
      } else {
        // Crear nuevo registro en el historial
        await TransactionHistoryModel.create({
          payment_reference: ticket.payment_reference || transaction.reference,
          wompi_transaction_id: ticket.wompi_transaction_id || transaction.id,
          payed_amount: ticket.payed_amount || (transaction.amount_in_cents ? transaction.amount_in_cents / 100 : 0),
          payment_status: ticket.payment_status || transaction.status || 'PENDING',
          user_id: ticket.user_id,
          customer_email: customer_email || ticket.customer_email,
          customer_name: customer_name || ticket.customer_name,
          created_at: ticket.payment_created_at 
            ? new Date(ticket.payment_created_at) 
            : (transaction.created_at ? new Date(transaction.created_at) : new Date()),
          finalized_at: ticket.payment_finalized_at 
            ? new Date(ticket.payment_finalized_at) 
            : (transaction.finalized_at ? new Date(transaction.finalized_at) : undefined),
          soccer_game_id: ticket.soccer_game_id,
          curva_id: ticket.curva_id,
          results_purchased: ticket.results_purchased || [],
          successful_purchase: ticket.payment_status === 'APPROVED' || transaction.status === 'APPROVED',
        })
      }
    } catch (error) {
      console.error('Error guardando historial de transacción:', error)
      // No lanzar error para no interrumpir el flujo principal
    }
  }

}
