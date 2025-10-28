import { Router } from 'express'
import { WompiWebhookController } from '@/controllers/wompi-webhook.controller'

const router = Router()
const wompiController = new WompiWebhookController()

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
router.post('/wompi', wompiController.handleWebhook)

/**
 * @swagger
 * /api/webhooks/create-payment:
 *   post:
 *     summary: Crear un nuevo pago con Wompi
 *     tags: [Payments]
 *     description: Endpoint para crear una transacción de pago con Wompi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - customerData
 *               - gameId
 *               - curvaId
 *               - quantity
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50000
 *                 description: Monto del pago en centavos
 *               customerData:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: "cliente@email.com"
 *                   name:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   phone:
 *                     type: string
 *                     example: "+573001234567"
 *               gameId:
 *                 type: string
 *                 example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *               curvaId:
 *                 type: string
 *                 example: "curva-123"
 *               quantity:
 *                 type: number
 *                 example: 2
 *               selectedResults:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["1.0", "2.1"]
 *     responses:
 *       201:
 *         description: Pago creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pago creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                       example: "12345678-1234-1234-1234-123456789012"
 *                     reference:
 *                       type: string
 *                       example: "TGS-2024-001"
 *                     ticket_id:
 *                       type: string
 *                       example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                     checkout_url:
 *                       type: string
 *                       example: "https://checkout.wompi.co/l/..."
 *       400:
 *         description: Datos de pago incompletos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/create-payment', wompiController.createPayment)

export default router
