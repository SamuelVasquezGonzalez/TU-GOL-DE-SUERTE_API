import axios from 'axios'
import { WOMPI_CONFIG } from '@/config/wompi.config'
import {
  WompiPaymentRequest,
  WompiPaymentResponse,
  WompiTransactionResponse,
} from '@/contracts/types/wompi.type'

export class WompiService {
  private baseURL = WOMPI_CONFIG.BASE_URL
  private privateKey = WOMPI_CONFIG.PRIVATE_KEY

  /**
   * Crear una transacción de pago en Wompi
   */
  async createPayment(paymentData: WompiPaymentRequest): Promise<WompiPaymentResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/transactions`, paymentData, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error) {
      console.error('Error creating Wompi payment:', error)
      throw new Error('Error al crear el pago en Wompi')
    }
  }

  /**
   * Consultar el estado de una transacción
   */
  async getTransactionStatus(transactionId: string): Promise<WompiTransactionResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error) {
      console.error('Error getting transaction status:', error)
      throw new Error('Error al consultar el estado de la transacción')
    }
  }

  /**
   * Validar la firma de un webhook
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto')

    const expectedSignature = crypto
      .createHmac('sha256', WOMPI_CONFIG.INTEGRITY_SECRET)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  /**
   * Generar una referencia única para el pago
   */
  generatePaymentReference(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `TGS-${timestamp}-${random}`.toUpperCase()
  }

  /**
   * Formatear datos del cliente para Wompi
   */
  formatCustomerData(customerData: { email: string; name: string; phone: string }) {
    return {
      customer_email: customerData.email,
      customer_data: {
        phone_number: customerData.phone,
        full_name: customerData.name,
      },
    }
  }

  /**
   * Preparar datos de pago para Wompi
   */
  preparePaymentRequest(data: {
    amount: number
    customerData: {
      email: string
      name: string
      phone: string
    }
    reference: string
    paymentMethod: string
  }): WompiPaymentRequest {
    const { amount, customerData, reference, paymentMethod } = data

    return {
      amount_in_cents: amount * 100, // Wompi usa centavos
      currency: WOMPI_CONFIG.CURRENCY,
      payment_method: {
        type: paymentMethod as any,
      },
      reference,
      ...this.formatCustomerData(customerData),
      redirect_url: WOMPI_CONFIG.SUCCESS_URL,
    }
  }
}
