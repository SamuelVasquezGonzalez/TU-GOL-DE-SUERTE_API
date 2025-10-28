import { Request, Response } from 'express'
import { WompiWebhookService } from '@/services/wompi-webhook.service'
import { WompiService } from '@/services/wompi.service'
import { ResponseError } from '@/utils/errors.util'
import { WompiWebhookPayload } from '@/contracts/types/wompi.type'

export class WompiWebhookController {
  private webhookService = new WompiWebhookService()
  private wompiService = new WompiService()

  /**
   * Endpoint para recibir webhooks de Wompi
   */
  public handleWebhook = async (req: Request, res: Response) => {
    try {
      // 1. Validar firma del webhook
      const signature = req.headers['x-wompi-signature'] as string
      const payload = JSON.stringify(req.body)

      if (!signature) {
        throw new ResponseError(401, 'Firma de webhook requerida')
      }

      const isValidSignature = this.wompiService.validateWebhookSignature(payload, signature)
      if (!isValidSignature) {
        throw new ResponseError(401, 'Firma de webhook inválida')
      }

      // 2. Procesar el webhook
      const webhookData: WompiWebhookPayload = req.body
      await this.webhookService.processWebhook(webhookData)

      // 3. Responder a Wompi
      res.status(200).json({
        received: true,
        message: 'Webhook procesado exitosamente',
      })
    } catch (error) {
      console.error('Error procesando webhook de Wompi:', error)

      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        })
      }
    }
  }

  /**
   * Endpoint para crear un pago (usado por el frontend)
   */
  public createPayment = async (req: Request, res: Response) => {
    try {
      const { amount, customerData, gameId, curvaId, quantity, selectedResults } = req.body

      if (!amount || !customerData || !gameId || !curvaId || !quantity) {
        throw new ResponseError(400, 'Datos de pago incompletos')
      }

      // Generar referencia única
      const reference = this.wompiService.generatePaymentReference()

      // Preparar datos de pago
      const paymentRequest = this.wompiService.preparePaymentRequest({
        amount,
        customerData,
        reference,
        paymentMethod: 'CARD', // Por defecto, el usuario puede cambiar en el checkout
      })

      // Crear transacción en Wompi
      const paymentResponse = await this.wompiService.createPayment(paymentRequest)

      // Crear ticket temporal con estado pendiente
      const ticket = await this.createPendingTicket({
        gameId,
        curvaId,
        quantity,
        selectedResults,
        customerData,
        reference,
        paymentResponse,
      })

      res.status(201).json({
        success: true,
        message: 'Pago creado exitosamente',
        data: {
          transaction_id: paymentResponse.data.id,
          reference: reference,
          ticket_id: ticket._id,
          checkout_url: paymentResponse.data.redirect_url,
        },
      })
    } catch (error) {
      console.error('Error creando pago:', error)

      if (error instanceof ResponseError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        })
      }
    }
  }

  /**
   * Crear ticket temporal con estado pendiente
   */
  private async createPendingTicket(data: {
    gameId: string
    curvaId: string
    quantity: number
    selectedResults: string[]
    customerData: any
    reference: string
    paymentResponse: any
  }) {
    const { TicketModel } = await import('@/models/ticket.model')

    const ticket = new TicketModel({
      ticket_number: await this.generateTicketNumber(),
      soccer_game_id: data.gameId,
      user_id: 'temp', // Se actualizará cuando se confirme el pago
      results_purchased: data.selectedResults,
      payed_amount: data.paymentResponse.data.amount_in_cents / 100,
      status: 'pending',
      curva_id: data.curvaId,
      created_date: new Date(),
      close: false,

      // Datos de pago
      payment_reference: data.reference,
      payment_status: 'PENDING',
      wompi_transaction_id: data.paymentResponse.data.id,
      customer_email: data.customerData.email,
      customer_name: data.customerData.name,
      customer_phone: data.customerData.phone,
      payment_method: data.paymentResponse.data.payment_method_type,
      payment_amount_cents: data.paymentResponse.data.amount_in_cents,
      payment_currency: data.paymentResponse.data.currency,
      payment_created_at: new Date(data.paymentResponse.data.created_at),
    })

    return await ticket.save()
  }

  /**
   * Generar número de ticket único
   */
  private async generateTicketNumber(): Promise<number> {
    const { TicketModel } = await import('@/models/ticket.model')

    const lastTicket = await TicketModel.findOne({}, {}, { sort: { ticket_number: -1 } })
    return lastTicket ? lastTicket.ticket_number + 1 : 1
  }
}
