/**
 * @swagger
 * components:
 *   schemas:
 *     WompiWebhookPayload:
 *       type: object
 *       required:
 *         - event
 *         - data
 *       properties:
 *         event:
 *           type: string
 *           description: Tipo de evento de Wompi
 *           example: "transaction.updated"
 *         data:
 *           type: object
 *           properties:
 *             transaction:
 *               $ref: '#/components/schemas/WompiTransaction'
 *         meta:
 *           type: object
 *           properties:
 *             platform_id:
 *               type: string
 *               example: "platform_123"
 *             platform_transaction_id:
 *               type: string
 *               example: "platform_tx_123"
 *             unique_id:
 *               type: string
 *               example: "unique_123"
 *
 *     WompiTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la transacción
 *           example: "12345678-1234-1234-1234-123456789012"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         finalized_at:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:35:00.000Z"
 *         amount_in_cents:
 *           type: number
 *           description: Monto en centavos
 *           example: 50000
 *         reference:
 *           type: string
 *           description: Referencia única del pago
 *           example: "TGS-2024-001"
 *         customer_email:
 *           type: string
 *           description: Email del cliente
 *           example: "cliente@email.com"
 *         currency:
 *           type: string
 *           description: Moneda del pago
 *           example: "COP"
 *         payment_method_type:
 *           type: string
 *           description: Tipo de método de pago
 *           example: "CARD"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, DECLINED, VOIDED, REFUNDED]
 *           description: Estado del pago
 *           example: "APPROVED"
 *         status_message:
 *           type: string
 *           description: Mensaje de estado
 *           example: "Transacción aprobada"
 *         payment_method:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "CARD"
 *             extra:
 *               type: object
 *               properties:
 *                 bin:
 *                   type: string
 *                   example: "424242"
 *                 name:
 *                   type: string
 *                   example: "VISA"
 *                 brand:
 *                   type: string
 *                   example: "VISA"
 *                 exp_year:
 *                   type: string
 *                   example: "2025"
 *                 exp_month:
 *                   type: string
 *                   example: "12"
 *                 last_four:
 *                   type: string
 *                   example: "4242"
 *         final_amount_in_cents:
 *           type: number
 *           description: Monto final en centavos
 *           example: 50000
 *
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - amount
 *         - customerData
 *         - gameId
 *         - curvaId
 *         - quantity
 *       properties:
 *         amount:
 *           type: number
 *           description: Monto del pago en centavos
 *           example: 50000
 *         customerData:
 *           type: object
 *           required:
 *             - email
 *             - name
 *             - phone
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               example: "cliente@email.com"
 *             name:
 *               type: string
 *               example: "Juan Pérez"
 *             phone:
 *               type: string
 *               example: "+573001234567"
 *         gameId:
 *           type: string
 *           description: ID del juego
 *           example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *         curvaId:
 *           type: string
 *           description: ID de la curva
 *           example: "curva-123"
 *         quantity:
 *           type: number
 *           description: Cantidad de resultados a comprar
 *           example: 2
 *         selectedResults:
 *           type: array
 *           items:
 *             type: string
 *           description: Resultados seleccionados
 *           example: ["1.0", "2.1"]
 *
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Pago creado exitosamente"
 *         data:
 *           type: object
 *           properties:
 *             transaction_id:
 *               type: string
 *               example: "12345678-1234-1234-1234-123456789012"
 *             reference:
 *               type: string
 *               example: "TGS-2024-001"
 *             ticket_id:
 *               type: string
 *               example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *             checkout_url:
 *               type: string
 *               example: "https://checkout.wompi.co/l/..."
 *
 *     WebhookResponse:
 *       type: object
 *       properties:
 *         received:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Webhook procesado exitosamente"
 *
 *   tags:
 *     - name: Webhooks
 *       description: Endpoints para recibir notificaciones de servicios externos
 *     - name: Payments
 *       description: Endpoints para manejo de pagos con Wompi
 */
