/**
 * @openapi
 * /v1/api/teams:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Obtener todos los equipos
 *     description: Obtener lista completa de equipos de fútbol
 *     responses:
 *       200:
 *         description: Equipos obtenidos exitosamente
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
 *                         $ref: '#/components/schemas/SoccerTeam'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags:
 *       - Teams
 *     summary: Crear nuevo equipo (Admin)
 *     description: Crear un nuevo equipo de fútbol - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - color
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del equipo
 *                 example: "Real Madrid"
 *               color:
 *                 type: string
 *                 description: Color representativo del equipo
 *                 example: "#FFFFFF"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "Logo/avatar del equipo"
 *     responses:
 *       201:
 *         description: Equipo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SoccerTeam'
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
 * /v1/api/teams/search:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Buscar equipos por nombre
 *     description: Buscar equipos utilizando el nombre como parámetro
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del equipo a buscar
 *         example: "Real"
 *     responses:
 *       200:
 *         description: Equipos encontrados exitosamente
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
 *                         $ref: '#/components/schemas/SoccerTeam'
 *       400:
 *         description: Nombre del equipo requerido
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
 * /v1/api/teams/{id}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Obtener equipo por ID
 *     description: Obtener detalles de un equipo específico
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Equipo obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SoccerTeam'
 *       404:
 *         description: Equipo no encontrado
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
 *   put:
 *     tags:
 *       - Teams
 *     summary: Actualizar equipo (Admin)
 *     description: Actualizar información de un equipo - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del equipo
 *                 example: "Real Madrid CF"
 *               color:
 *                 type: string
 *                 description: Color representativo
 *                 example: "#FFFFFF"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "Logo/avatar del equipo (opcional)"
 *     responses:
 *       200:
 *         description: Equipo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SoccerTeam'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Equipo no encontrado
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
 *   delete:
 *     tags:
 *       - Teams
 *     summary: Eliminar equipo (Admin)
 *     description: Eliminar un equipo del sistema - Solo administradores
 *     security:
 *       - TokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del equipo
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Equipo eliminado exitosamente
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
 *       404:
 *         description: Equipo no encontrado
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

