import cors, { CorsOptions } from 'cors'
import express, { Application, Request, Response, NextFunction } from 'express'
import { Server, Socket } from 'socket.io'
import { createServer } from 'http'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import rateLimit from 'express-rate-limit'
import { createAdapter } from '@socket.io/redis-adapter'
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
import { staffCommissionHistoryRoutes } from './routes/staff-commission-history.routes'
import webhookRoutes from './routes/webhook.routes'
import { redisPubClient, redisSubClient, isRedisConnected } from './config/redis.config'

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

// Configurar trust proxy para producción (necesario para rate-limit detrás de proxies como Render, Nginx)
app.set('trust proxy', 1)

export const http_server = createServer(app)
const API_VERSION = '/v1/api'

export const io_server = new Server(http_server, {
  cors: ioCorsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

// Configurar Redis Adapter para Socket.io (se configura después de conectar Redis)
// Esta función se llama desde index.ts después de conectar Redis
export async function configureSocketIoRedisAdapter() {
  // Esperar un momento para que Redis se conecte
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (isRedisConnected()) {
    try {
      io_server.adapter(createAdapter(redisPubClient, redisSubClient))
      console.log('✅ Socket.io Redis Adapter configurado')
    } catch (error) {
      console.warn('⚠️ Error configurando Redis adapter:', error)
      console.warn('⚠️ Socket.io funcionando sin Redis adapter (single instance)')
    }
  } else {
    console.warn('⚠️ Socket.io funcionando sin Redis adapter (single instance)')
  }
}

io_server.on('connection', (socket: Socket) => {
  console.log('Cliente conectado', socket.id)
  register_all_game_events(socket)
})

app.use(cors(corsOptions))

// Rate Limiting - Configuración general (más permisiva)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por IP por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate Limiting - Más estricto para endpoints críticos (reservado para uso futuro)
// const strictLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100, // 100 requests por IP por ventana
//   message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
//   standardHeaders: true,
//   legacyHeaders: false,
// })

// Rate Limiting - Webhooks (más permisivo, pero con límite)
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 50, // 50 webhooks por minuto
  message: 'Demasiados webhooks desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
})

// Aplicar rate limiting general (excepto health y docs)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Excluir endpoints de health y docs del rate limiting
  if (req.path === '/v1/api/health' || req.path.startsWith('/api-docs')) {
    return next()
  }
  return generalLimiter(req, res, next)
})

// Middleware específico para webhooks de Wompi (DEBE ir ANTES de express.json())
app.use(`${API_VERSION}/webhooks/wompi`, webhookLimiter, express.raw({ type: 'application/json' }))

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
app.use(`${API_VERSION}/commissions`, staffCommissionHistoryRoutes)

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
