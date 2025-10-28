import { WompiService } from './wompi.service'
import { TicketService } from './ticket.service'
import { PaymentLogModel } from '@/models/payment_log.model'
import { TicketModel } from '@/models/ticket.model'
import { WompiWebhookPayload } from '@/contracts/types/wompi.type'
import { send_ticket_purchase_email } from '@/emails/email-main'

export class WompiWebhookService {
  private ticketService = new TicketService()

  /**
   * Procesar webhook de Wompi
   */
  async processWebhook(payload: WompiWebhookPayload): Promise<void> {
    const { event, data } = payload
    const transaction = data.transaction

    try {
      // Log del evento recibido
      await this.logWebhookEvent(transaction.id, event, transaction.status, transaction)

      // Procesar según el tipo de evento
      switch (event) {
        case 'transaction.updated':
          await this.processTransactionUpdate(transaction)
          break
        case 'transaction.created':
          await this.processTransactionCreated(transaction)
          break
        default:
          console.log(`Evento no manejado: ${event}`)
      }
    } catch (error) {
      console.error('Error procesando webhook:', error)
      await this.logWebhookError(transaction.id, event, error)
      throw error
    }
  }

  /**
   * Procesar actualización de transacción
   */
  private async processTransactionUpdate(transaction: any): Promise<void> {
    const { id, status, reference, customer_email } = transaction

    // Buscar ticket por referencia
    const ticket = await TicketModel.findOne({
      payment_reference: reference,
    })

    if (!ticket) {
      console.error(`Ticket no encontrado para referencia: ${reference}`)
      return
    }

    // Actualizar estado del ticket
    ticket.payment_status = status
    ticket.wompi_transaction_id = id
    ticket.payment_finalized_at = transaction.finalized_at
      ? new Date(transaction.finalized_at)
      : undefined

    // Si el pago es aprobado, activar el ticket
    if (status === 'APPROVED') {
      ticket.status = 'pending' // Cambiar a 'pending' para que esté activo
      ticket.customer_email = customer_email

      // Enviar notificación al cliente
      await this.sendPaymentConfirmationEmail(ticket)
    }

    // Si el pago es rechazado, cancelar el ticket
    if (status === 'DECLINED') {
      ticket.status = 'lost' // Marcar como perdido
      await this.sendPaymentErrorEmail(ticket)
    }

    await ticket.save()

    console.log(`Ticket ${ticket.ticket_number} actualizado con estado: ${status}`)
  }

  /**
   * Procesar nueva transacción
   */
  private async processTransactionCreated(transaction: any): Promise<void> {
    const { id, status, reference } = transaction

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
    ticket.payment_created_at = new Date(transaction.created_at)

    await ticket.save()

    console.log(`Ticket ${ticket.ticket_number} creado con transacción: ${id}`)
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
   * Enviar email de error de pago
   */
  private async sendPaymentErrorEmail(ticket: any): Promise<void> {
    try {
      // Aquí podrías implementar un email específico para errores de pago
      console.log(`Email de error enviado para ticket ${ticket.ticket_number}`)
    } catch (error) {
      console.error('Error enviando email de error:', error)
    }
  }

  /**
   * Log de evento de webhook
   */
  private async logWebhookEvent(
    transactionId: string,
    eventType: string,
    paymentStatus: string,
    rawPayload: any
  ): Promise<void> {
    try {
      await PaymentLogModel.create({
        transaction_id: transactionId,
        event_type: eventType,
        payment_status: paymentStatus,
        raw_payload: rawPayload,
        processed_at: new Date(),
      })
    } catch (error) {
      console.error('Error logging webhook event:', error)
    }
  }

  /**
   * Log de error de webhook
   */
  private async logWebhookError(
    transactionId: string,
    eventType: string,
    error: any
  ): Promise<void> {
    try {
      await PaymentLogModel.create({
        transaction_id: transactionId,
        event_type: eventType,
        error_message: error.message || 'Error desconocido',
        raw_payload: null,
        processed_at: new Date(),
        retry_count: 1,
      })
    } catch (logError) {
      console.error('Error logging webhook error:', logError)
    }
  }
}
