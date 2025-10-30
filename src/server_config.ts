import cors, { CorsOptions } from 'cors'
import express, { Application, Request, Response } from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import { ALLOWED_METHODS, ALLOWED_ORIGINS } from './shared/contants'
import { register_all_game_events } from './events/game_events'
import { swaggerSpec } from './docs/swagger.config'
import { userRoutes } from './routes/user.routes'
import { ticketRoutes } from './routes/ticket.routes'
import { teamsRoutes } from './routes/teams.routes'
import { gamesRoutes } from './routes/games.routes'
import { playerRoutes } from './routes/player.routes'
import { transactionHistoryRoutes } from './routes/transaction-history.routes'
import { statsRoutes } from './routes/stats.routes'
import webhookRoutes from './routes/webhook.routes'

const corsOptions: CorsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ALLOWED_METHODS,
  allowedHeaders: ['*'],
  credentials: true,
  optionsSuccessStatus: 204,
}

const ioCorsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ALLOWED_METHODS,
  allowedHeaders: ['*'],
  credentials: true,
  optionsSuccessStatus: 204,
}

export const app: Application = express()
export const http_server = createServer(app)
const API_VERSION = '/v1/api'

export const io_server = new Server(http_server, {
  cors: ioCorsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

io_server.on('connection', (socket) => {
  console.log('Cliente conectado', socket.id)
  register_all_game_events(socket)
})

app.use(cors(corsOptions))

// Middleware específico para webhooks de Wompi (DEBE ir ANTES de express.json())
app.use(`${API_VERSION}/webhooks/wompi`, express.raw({ type: 'application/json' }))

app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(morgan('dev'))

// Configuración de Swagger
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TU GOL DE SUERTE API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
)

// Endpoint para obtener el spec JSON de Swagger
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'TU GOL DE SUERTE API',
    version: '1.0.0',
    access: 'private',
    ok: true,
    documentation: '/api-docs',
  })
})

// Health endpoint
app.get(`${API_VERSION}/health`, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API TU-GOL-DE-SUERTE funcionando correctamente',
    version: 'v1.0.0',
    timestamp: new Date().toISOString(),
  })
})

app.use(`${API_VERSION}/users`, userRoutes)
app.use(`${API_VERSION}/tickets`, ticketRoutes)
app.use(`${API_VERSION}/teams`, teamsRoutes)
app.use(`${API_VERSION}/games`, gamesRoutes)
app.use(`${API_VERSION}/players`, playerRoutes)
app.use(`${API_VERSION}/transaction-history`, transactionHistoryRoutes)
app.use(`${API_VERSION}/stats`, statsRoutes)

// Rutas de webhook (sin prefijo de versión para compatibilidad con Wompi)
app.use(`${API_VERSION}/webhooks`, webhookRoutes)

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path,
    method: req.method,
    requested: req.ip,
  })
})
