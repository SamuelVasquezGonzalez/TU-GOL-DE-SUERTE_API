/**
 * @openapi
 * /v1/api/games:
 *   get:
 *     tags:
 *       - Games
 *     summary: Obtener todos los partidos
 *     description: Obtener lista completa de partidos de fútbol
 *     responses:
 *       200:
 *         description: Partidos obtenidos exitosamente
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
 *                         $ref: '#/components/schemas/SoccerGame'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Games
 *     summary: Crear nuevo partido (Admin)
 *     description: Crear un nuevo partido de fútbol - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - soccer_teams
 *               - start_date
 *               - end_time
 *               - status
 *               - tournament
 *             properties:
 *               soccer_teams:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: IDs de los equipos [local, visitante]
 *                 example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de inicio
 *                 example: "2023-12-01T15:00:00.000Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de finalización
 *                 example: "2023-12-01T17:00:00.000Z"
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, finished]
 *                 description: Estado del partido
 *                 example: "pending"
 *               tournament:
 *                 type: string
 *                 description: Nombre del torneo
 *                 example: "Liga Profesional"
 *     responses:
 *       201:
 *         description: Partido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SoccerGame'
 *       400:
 *         description: Datos inválidos
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
 * /v1/api/games/search/date:
 *   get:
 *     tags:
 *       - Games
 *     summary: Buscar partidos por fecha
 *     description: Obtener partidos para una fecha específica
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha en formato ISO
 *         example: "2023-12-01T15:00:00.000Z"
 *     responses:
 *       200:
 *         description: Partidos de la fecha obtenidos exitosamente
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
 *                         $ref: '#/components/schemas/SoccerGame'
 *       400:
 *         description: Fecha requerida
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
 * /v1/api/games/{id}:
 *   get:
 *     tags:
 *       - Games
 *     summary: Obtener partido por ID
 *     description: Obtener detalles de un partido específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del partido
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Partido obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SoccerGame'
 *       404:
 *         description: Partido no encontrado
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
 * /v1/api/games/tournament/{tournament}:
 *   get:
 *     tags:
 *       - Games
 *     summary: Obtener partidos por torneo
 *     description: Obtener todos los partidos de un torneo específico
 *     parameters:
 *       - in: path
 *         name: tournament
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del torneo
 *         example: "Liga Profesional"
 *     responses:
 *       200:
 *         description: Partidos del torneo obtenidos exitosamente
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
 *                         $ref: '#/components/schemas/SoccerGame'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /v1/api/games/{game_id}/curva/{curva_id}:
 *   get:
 *     tags:
 *       - Games
 *     summary: Obtener curva específica
 *     description: Obtener detalles de una curva específica de un partido
 *     parameters:
 *       - in: path
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del partido
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: curva_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la curva
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *       - in: query
 *         name: include_game
 *         schema:
 *           type: boolean
 *         description: Incluir información del partido
 *         example: true
 *     responses:
 *       200:
 *         description: Curva obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Curva'
 *       404:
 *         description: Curva no encontrada
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
 * /v1/api/games/{game_id}/curva:
 *   post:
 *     tags:
 *       - Games
 *     summary: Abrir nueva curva (Admin)
 *     description: Abrir una nueva curva para apuestas en un partido - Solo administradores
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
 *       201:
 *         description: Nueva curva abierta exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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
 * /v1/api/games/{game_id}/score:
 *   put:
 *     tags:
 *       - Games
 *     summary: Actualizar marcador (Admin)
 *     description: Actualizar el marcador del partido - Solo administradores
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 2
 *                 maxItems: 2
 *                 description: Marcador [local, visitante]
 *                 example: [2, 1]
 *     responses:
 *       200:
 *         description: Marcador actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Marcador válido es requerido
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
 * /v1/api/games/{game_id}/end:
 *   put:
 *     tags:
 *       - Games
 *     summary: Finalizar partido (Admin)
 *     description: Marcar un partido como finalizado - Solo administradores
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
 *         description: Partido finalizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
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

