import { Router } from 'express'
import { StaffCommissionHistoryController } from '@/controllers/staff-commission-history.controller'
import { staff_auth } from '@/auth/staff.auth'
import { admin_auth } from '@/auth/admin.auth'

const router = Router()
const commission_controller = new StaffCommissionHistoryController()

// ==================== RUTAS PARA STAFF ====================

/**
 * @swagger
 * /api/commissions/my:
 *   get:
 *     summary: Obtener todas las comisiones del staff autenticado
 *     tags: [Staff Commissions]
 *     description: Endpoint para que el staff vea todas sus comisiones y el total acumulado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comisiones del staff obtenidas exitosamente
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
 *                   example: "Comisiones del staff obtenidas exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     commissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totals:
 *                       type: object
 *                       properties:
 *                         total_net_commission:
 *                           type: number
 *                         total_tickets_sold:
 *                           type: number
 *                         total_amount_sold:
 *                           type: number
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/my', staff_auth, commission_controller.get_my_commissions)

/**
 * @swagger
 * /api/commissions/my/game/:game_id:
 *   get:
 *     summary: Obtener comisión del staff autenticado por partido específico
 *     tags: [Staff Commissions]
 *     description: Endpoint para que el staff vea su comisión de un partido específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del partido
 *     responses:
 *       200:
 *         description: Comisión del staff por partido obtenida exitosamente
 *       400:
 *         description: El ID del partido es requerido
 *       404:
 *         description: No se encontró comisión para este staff en este partido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/my/game/:game_id', staff_auth, commission_controller.get_my_commission_by_game)

// ==================== RUTAS PARA ADMIN ====================

/**
 * @swagger
 * /api/commissions/all:
 *   get:
 *     summary: Obtener todas las comisiones de todos los staff (admin)
 *     tags: [Staff Commissions]
 *     description: Endpoint para que el admin vea todas las comisiones de todos los vendedores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: game_id
 *         schema:
 *           type: string
 *         description: ID del partido (opcional, para filtrar por partido)
 *     responses:
 *       200:
 *         description: Todas las comisiones obtenidas exitosamente
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
 *                   example: "Todas las comisiones obtenidas exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     commissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     staff_totals:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/all', admin_auth, commission_controller.get_all_commissions)

/**
 * @swagger
 * /api/commissions/game/:game_id:
 *   get:
 *     summary: Obtener comisiones agrupadas por partido (admin)
 *     tags: [Staff Commissions]
 *     description: Endpoint para que el admin vea todas las comisiones de un partido específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del partido
 *     responses:
 *       200:
 *         description: Comisiones por partido obtenidas exitosamente
 *       400:
 *         description: El ID del partido es requerido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/game/:game_id', admin_auth, commission_controller.get_commissions_by_game)

/**
 * @swagger
 * /api/commissions/staff/:staff_id:
 *   get:
 *     summary: Obtener comisiones de un staff específico (admin)
 *     tags: [Staff Commissions]
 *     description: Endpoint para que el admin vea las comisiones de un staff específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del staff
 *     responses:
 *       200:
 *         description: Comisiones del staff obtenidas exitosamente
 *       400:
 *         description: El ID del staff es requerido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/staff/:staff_id', admin_auth, commission_controller.get_staff_commissions_by_id)

export { router as staffCommissionHistoryRoutes }

