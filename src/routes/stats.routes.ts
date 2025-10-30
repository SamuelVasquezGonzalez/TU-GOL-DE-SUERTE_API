import { Router } from 'express'
import { StatsController } from '@/controllers/stats.controller'
import { customer_auth } from '@/auth/customer.auth'
import { staff_auth } from '@/auth/staff.auth'
import { admin_auth } from '@/auth/admin.auth'

const router = Router()
const stats_controller = new StatsController()

// ==================== GET ROUTES ====================

/**
 * @swagger
 * /api/stats/user:
 *   get:
 *     summary: Obtener estadísticas del usuario autenticado
 *     tags: [Stats]
 *     security:
 *       - TokenAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del usuario obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 */
router.get('/user', customer_auth, stats_controller.getUserStats)

/**
 * @swagger
 * /api/stats/user/:user_id:
 *   get:
 *     summary: Obtener estadísticas de un usuario específico (admin/staff)
 *     tags: [Stats]
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas del usuario obtenidas exitosamente
 */
router.get('/user/:user_id', customer_auth, stats_controller.getUserStatsById)

/**
 * @swagger
 * /api/stats/staff:
 *   get:
 *     summary: Obtener estadísticas del staff en sesión
 *     tags: [Stats]
 *     security:
 *       - TokenAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del staff obtenidas exitosamente
 */
router.get('/staff', staff_auth, stats_controller.getStaffStats)

/**
 * @swagger
 * /api/stats/staff/:staff_id:
 *   get:
 *     summary: Obtener estadísticas de un staff específico (admin)
 *     tags: [Stats]
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas del staff obtenidas exitosamente
 */
router.get('/staff/:staff_id', staff_auth, stats_controller.getStaffStatsById)

/**
 * @swagger
 * /api/stats/general:
 *   get:
 *     summary: Obtener estadísticas generales del sistema (admin/staff)
 *     tags: [Stats]
 *     security:
 *       - TokenAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales obtenidas exitosamente
 */
router.get('/general', admin_auth, stats_controller.getGeneralStats)

export { router as statsRoutes }

