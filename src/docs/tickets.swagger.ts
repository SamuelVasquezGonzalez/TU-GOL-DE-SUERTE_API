/**
 * @openapi
 * /v1/api/tickets/my-tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener mis tickets
 *     description: Obtener todos los tickets del usuario autenticado
 *     security:
 *       - TokenAuth: []
 *     responses:
 *       200:
 *         description: Tickets obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Token no válido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener ticket por ID
 *     description: Obtener detalles de un ticket específico
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ticket
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Ticket obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Token no válido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ticket no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'

/**
 * @openapi
 * /v1/api/tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener todos los tickets (Admin)
 *     description: Obtener lista completa de todos los tickets - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     responses:
 *       200:
 *         description: Todos los tickets obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Crear nuevo ticket de apuesta
 *     description: Crear un nuevo ticket de apuesta para un partido y curva específica
 *     security:
 *       - TokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_id
 *               - curva_id
 *               - quantity
 *             properties:
 *               game_id:
 *                 type: string
 *                 description: ID del partido
 *                 example: "507f1f77bcf86cd799439011"
 *               curva_id:
 *                 type: string
 *                 description: ID de la curva donde apostar
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Cantidad de boletas
 *                 example: 1
 *     responses:
 *       201:
 *         description: Ticket creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Datos incompletos o inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token no válido o no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/tickets/user/{user_id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener tickets por usuario (Admin)
 *     description: Obtener todos los tickets de un usuario específico - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Tickets del usuario obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/tickets/game/{game_id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener tickets por partido (Admin)
 *     description: Obtener todos los tickets de un partido específico - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del partido
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Tickets del juego obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/tickets/curva/{curva_id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Obtener tickets por curva (Admin)
 *     description: Obtener todos los tickets de una curva específica - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: curva_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la curva
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Tickets de la curva obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/tickets/admin:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Crear ticket como administrador (Admin)
 *     description: Crear un nuevo ticket especificando el usuario - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_id
 *               - customer_id
 *               - curva_id
 *               - quantity
 *             properties:
 *               game_id:
 *                 type: string
 *                 description: ID del partido
 *                 example: "507f1f77bcf86cd799439011"
 *               customer_id:
 *                 type: string
 *                 description: ID del usuario cliente
 *                 example: "507f1f77bcf86cd799439013"
 *               curva_id:
 *                 type: string
 *                 description: ID de la curva donde apostar
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Cantidad de boletas
 *                 example: 1
 *     responses:
 *       201:
 *         description: Ticket creado exitosamente por administrador
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Datos incompletos o inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/tickets/{id}/status:
 *   put:
 *     tags:
 *       - Tickets
 *     summary: Cambiar estado del ticket (Admin)
 *     description: Actualizar el estado de un ticket - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ticket
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, won, lost]
 *                 description: Nuevo estado del ticket
 *                 example: "won"
 *     responses:
 *       200:
 *         description: Estado del ticket actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Estado es requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ticket no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
