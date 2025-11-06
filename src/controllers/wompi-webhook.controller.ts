import { Request, Response } from 'express'
import { WompiWebhookService } from '../services/wompi-webhook.service'
import { wompiWebhookQueue } from '../config/queue.config'
import { isRedisConnected } from '../config/redis.config'
import * as crypto from 'crypto'

export class WompiWebhookController {
  private webhookService: WompiWebhookService

  constructor() {
    this.webhookService = new WompiWebhookService()
  }

  /**
   * Endpoint para recibir webhooks de Wompi
   */
  public handleWebhook = async (req: Request, res: Response) => {
    try {
      // ✅ CORRECCIÓN 1: Leer del header correcto
      const signature = req.headers['x-event-checksum'] as string
      
      // ✅ CORRECCIÓN 2: Usar el Buffer RAW directamente
      const rawBodyBuffer = req.body as Buffer
      const payloadString = rawBodyBuffer ? rawBodyBuffer.toString('utf8') : ''

      // 1. Validar la firma del webhook usando el Buffer RAW
      if (!validateWompiSignature(rawBodyBuffer, signature)) {
        console.error('Webhook signature validation failed', { 
          signature: signature || 'ausente', 
          payloadLength: payloadString.length,
          rawBodyBufferLength: rawBodyBuffer ? rawBodyBuffer.length : 0
        })
        return res.status(400).json({ error: 'Invalid signature' })
      }

      // 2. Parsear el JSON para procesar
      const event = JSON.parse(payloadString)


      // Log del evento recibido para debugging

      // 3. Manejar según el tipo de evento
      // Nota: Respondemos 200 inmediatamente para evitar reintentos de Wompi
      // El procesamiento se hace en segundo plano
      res.status(200).json({ success: true })

      // Procesar el evento de forma asíncrona (con queue si Redis está disponible)
      switch (event.event) {
        case 'transaction.updated':
          // Usar queue si Redis está disponible, sino procesar directamente
          if (isRedisConnected()) {
            wompiWebhookQueue.add('process-transaction-update', event.data, {
              priority: 1, // Alta prioridad para transacciones aprobadas
            }).catch((err: Error) => {
              console.error('Error agregando webhook a queue:', err)
              // Fallback: procesar directamente si falla la queue
              this.handleTransactionUpdated(event.data).catch(err => {
                console.error('Error procesando transaction.updated:', err)
              })
            })
          } else {
            // Procesar directamente si no hay Redis
            this.handleTransactionUpdated(event.data).catch(err => {
              console.error('Error procesando transaction.updated:', err)
            })
          }
          break
        case 'transaction.created':
          this.handleTransactionCreated(event.data).catch(err => {
            console.error('Error procesando transaction.created:', err)
          })
          break
        case 'transaction.approved':
          this.handleTransactionApproved(event.data).catch(err => {
            console.error('Error procesando transaction.approved:', err)
          })
          break
        case 'transaction.declined':
          this.handleTransactionDeclined(event.data).catch(err => {
            console.error('Error procesando transaction.declined:', err)
          })
          break
        default:
          console.log(`⚠️ Tipo de evento desconocido: ${event.event}`)
      }
    } catch (error) {
      console.error('Error procesando webhook:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  /**
   * Manejar transacción actualizada
   */
  private async handleTransactionUpdated(transactionData: any) {
    await this.webhookService.processTransactionUpdate(transactionData)
  }

  /**
   * Manejar transacción creada
   */
  private async handleTransactionCreated(transactionData: any) {
    await this.webhookService.processTransactionCreated(transactionData)
  }

  /**
   * Manejar transacción aprobada
   */
  private async handleTransactionApproved(transactionData: any) {
    await this.webhookService.processTransactionApproved(transactionData)
  }

  /**
   * Manejar transacción rechazada
   */
  private async handleTransactionDeclined(transactionData: any) {
    await this.webhookService.processTransactionDeclined(transactionData)
  }
}

// ✅ FÓRMULA CORRECTA SEGÚN DOCUMENTACIÓN DE WOMPI
function validateWompiSignature(rawBodyBuffer: Buffer, signature: string): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET
  if (!secret) {
    console.error('WOMPI_EVENTS_SECRET no configurado')
    return false
  }

  if (!signature) {
    console.error('Firma de webhook no proporcionada')
    return false
  }

  if (!rawBodyBuffer) {
    console.error('Buffer del body no disponible')
    return false
  }

  try {
    // Parsear el JSON del evento
    const event = JSON.parse(rawBodyBuffer.toString('utf8'))
    
    // Verificar que tenga la estructura correcta
    if (!event.signature || !event.signature.properties || !event.timestamp) {
      console.error('Estructura del evento inválida - faltan campos signature')
      return false
    }

    // Paso 1: Concatenar los valores de los campos especificados en properties
    let propertiesValues = ''
    for (const property of event.signature.properties) {
      const value = getNestedValue(event.data, property)
      if (value !== undefined && value !== null) {
        propertiesValues += value.toString()
      }
    }

    // Paso 2: Concatenar el timestamp
    const timestamp = event.timestamp.toString()

    // Paso 3: Concatenar el secreto
    const stringToHash = propertiesValues + timestamp + secret

    // Paso 4: Calcular SHA256
    const expectedSignature = crypto
      .createHash('sha256')
      .update(stringToHash)
      .digest('hex')

    // Comparar sin importar mayúsculas/minúsculas
    return expectedSignature.toLowerCase() === signature.toLowerCase()

  } catch (error) {
    console.error('Error parsing event JSON:', error)
    return false
  }
}

// Función auxiliar para obtener valores anidados del objeto data
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}
