import { wompiWebhookQueue } from '@/config/queue.config'
import { WompiWebhookService } from './wompi-webhook.service'

/**
 * Procesador de jobs de la queue
 * Se inicializa al arrancar el servidor
 */
export class QueueProcessorService {
  private webhookService: WompiWebhookService

  constructor() {
    this.webhookService = new WompiWebhookService()
  }

  /**
   * Inicializar procesadores de queue
   */
  public initializeProcessors(): void {
    // Procesar webhooks de Wompi
    wompiWebhookQueue.process('process-transaction-update', async (job: any) => {
      const transactionData = job.data
      await this.webhookService.processTransactionUpdate(transactionData)
    })
  }
}

// Inicializar procesadores al importar el módulo
export const queueProcessor = new QueueProcessorService()

