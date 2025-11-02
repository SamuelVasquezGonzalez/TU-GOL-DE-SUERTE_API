import Queue from 'bull'
import { GLOBAL_ENV } from '@/shared/contants'

// Queue para procesar webhooks de Wompi de forma asíncrona
// Esto asegura que no se pierdan eventos si el servidor se reinicia
export const wompiWebhookQueue = new Queue('wompi-webhooks', {
  redis: {
    host: GLOBAL_ENV.REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: Number(GLOBAL_ENV.REDIS_PORT || process.env.REDIS_PORT || 6379),
    password: GLOBAL_ENV.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3, // Reintentar hasta 3 veces
    backoff: {
      type: 'exponential',
      delay: 2000, // 2 segundos iniciales
    },
    removeOnComplete: {
      age: 3600, // Mantener jobs completados por 1 hora
      count: 1000, // Máximo 1000 jobs completados
    },
    removeOnFail: {
      age: 86400, // Mantener jobs fallidos por 24 horas
    },
  },
})

// Manejo de errores de la queue
wompiWebhookQueue.on('error', (error) => {
  console.error('❌ Wompi Webhook Queue Error:', error)
})

wompiWebhookQueue.on('failed', (job, error) => {
  console.error(`❌ Webhook job ${job?.id} failed:`, error)
})

wompiWebhookQueue.on('completed', () => {
  // Job completado exitosamente
})

// Procesar jobs de la queue
// Este worker se configura en wompi-webhook.service.ts
export { wompiWebhookQueue as webhookQueue }

