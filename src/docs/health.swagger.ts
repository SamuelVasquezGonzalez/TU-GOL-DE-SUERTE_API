/**
 * @openapi
 * /v1/api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verificar estado de la API
 *     description: Endpoint de salud para verificar que la API esté funcionando correctamente
 *     responses:
 *       200:
 *         description: API funcionando correctamente
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
 *                   example: "API TU-GOL-DE-SUERTE funcionando correctamente"
 *                 version:
 *                   type: string
 *                   example: "v1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:00:00.000Z"
 */
