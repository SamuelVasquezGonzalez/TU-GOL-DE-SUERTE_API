import { Router, Request, Response } from 'express'
import { WompiWebhookController } from '@/controllers/wompi-webhook.controller'

const router = Router()

// Lazy initialization para evitar problemas de carga de módulos
let wompiControllerInstance: WompiWebhookController | null = null
const getWompiController = (): WompiWebhookController => {
  if (!wompiControllerInstance) {
    wompiControllerInstance = new WompiWebhookController()
  }
  return wompiControllerInstance
}

/**
 * @swagger
 * /api/webhooks/wompi:
 *   post:
 *     summary: Webhook para recibir notificaciones de Wompi
 *     tags: [Webhooks]
 *     description: Endpoint que recibe notificaciones de Wompi sobre cambios en transacciones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "transaction.updated"
 *               data:
 *                 type: object
 *                 properties:
 *                   transaction:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "12345678-1234-1234-1234-123456789012"
 *                       status:
 *                         type: string
 *                         example: "APPROVED"
 *                       reference:
 *                         type: string
 *                         example: "TGS-2024-001"
 *                       customer_email:
 *                         type: string
 *                         example: "cliente@email.com"
 *                       amount_in_cents:
 *                         type: number
 *                         example: 50000
 *     headers:
 *       x-wompi-signature:
 *         description: Firma HMAC-SHA256 del payload
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Webhook procesado exitosamente"
 *       401:
 *         description: Firma de webhook inválida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Firma de webhook inválida"
 *       500:
 *         description: Error interno del servidor
 */
router.post('/wompi', (req: Request, res: Response) => getWompiController().handleWebhook(req, res))


export default router
