import { Router } from 'express'
import { TransactionHistoryController } from '@/controllers/transaction-history.controller'
import { admin_auth } from '@/auth/admin.auth'

const router = Router()
const transaction_history_controller = new TransactionHistoryController()

/**
 * @swagger
 * /api/transaction-history:
 *   get:
 *     summary: Obtener todas las transacciones del historial
 *     tags: [Transaction History]
 *     description: Endpoint para listar todas las transacciones guardadas en el historial
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de transacciones obtenido exitosamente
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
 *                   example: "Historial de transacciones obtenido exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       payment_reference:
 *                         type: string
 *                       wompi_transaction_id:
 *                         type: string
 *                       payed_amount:
 *                         type: number
 *                       payment_status:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       customer_email:
 *                         type: string
 *                       customer_name:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       finalized_at:
 *                         type: string
 *                         format: date-time
 *                       soccer_game_id:
 *                         type: string
 *                       curva_id:
 *                         type: string
 *                       results_purchased:
 *                         type: array
 *                         items:
 *                           type: string
 *                       successful_purchase:
 *                         type: boolean
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', admin_auth, transaction_history_controller.get_all_transactions)

/**
 * @swagger
 * /api/transaction-history/{id}:
 *   delete:
 *     summary: Eliminar una transacción del historial
 *     tags: [Transaction History]
 *     description: Endpoint para eliminar una transacción específica del historial por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la transacción a eliminar
 *     responses:
 *       200:
 *         description: Transacción eliminada exitosamente
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
 *                   example: "Transacción eliminada exitosamente del historial"
 *       400:
 *         description: El ID de la transacción es requerido
 *       404:
 *         description: No se encontró la transacción en el historial
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', admin_auth, transaction_history_controller.delete_transaction)

export { router as transactionHistoryRoutes }





