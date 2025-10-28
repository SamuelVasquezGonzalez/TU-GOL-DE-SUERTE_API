import swaggerJSDoc from 'swagger-jsdoc'
import { GLOBAL_ENV } from '../shared/contants'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TU GOL DE SUERTE API',
    version: '1.0.0',
    description: 'API para sistema de apuestas deportivas',
    contact: {
      name: 'TU GOL DE SUERTE',
      email: 'support@tugoldesuerte.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${GLOBAL_ENV.PORT}`,
      description: 'Servidor de desarrollo',
    },
    {
      url: `http://127.0.0.1:${GLOBAL_ENV.PORT}`,
      description: 'Servidor local',
    },
  ],
  components: {
    securitySchemes: {
      TokenAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Token JWT (sin Bearer prefix)',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email', 'password', 'identity', 'role'],
        properties: {
          _id: {
            type: 'string',
            description: 'ID único del usuario',
          },
          name: {
            type: 'string',
            description: 'Nombre completo del usuario',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico único',
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'Contraseña del usuario',
          },
          identity: {
            type: 'object',
            properties: {
              type_document: {
                type: 'string',
                enum: ['CC', 'CE', 'TI', 'PP', 'NIT'],
                description: 'Tipo de documento',
              },
              number_document: {
                type: 'string',
                description: 'Número de documento',
              },
            },
            required: ['type_document', 'number_document'],
          },
          phone: {
            type: 'string',
            description: 'Número de teléfono',
          },
          role: {
            type: 'string',
            enum: ['admin', 'customer'],
            description: 'Rol del usuario',
          },
          recover_code: {
            type: 'number',
            description: 'Código de recuperación',
          },
          avatar: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL del avatar',
              },
              public_id: {
                type: 'string',
                description: 'ID público del archivo',
              },
            },
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
        },
      },
      SoccerGame: {
        type: 'object',
        required: [
          'soccer_teams',
          'start_date',
          'end_time',
          'status',
          'tournament',
          'soccer_price',
        ],
        properties: {
          _id: {
            type: 'string',
            description: 'ID único del partido',
          },
          soccer_teams: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 2,
            maxItems: 2,
            description: 'IDs de los equipos [local, visitante]',
          },
          start_date: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de inicio',
          },
          end_time: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de finalización',
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'finished'],
            description: 'Estado del partido',
          },
          score: {
            type: 'array',
            items: {
              type: 'number',
            },
            minItems: 2,
            maxItems: 2,
            description: 'Marcador [local, visitante]',
            default: [0, 0],
          },
          tournament: {
            type: 'string',
            description: 'Nombre del torneo',
          },
          soccer_price: {
            type: 'number',
            minimum: 0,
            description: 'Precio del partido',
          },
          curvas_open: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Curva',
            },
            description: 'Curvas abiertas para apuestas',
          },
          created_date: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
        },
      },
      Curva: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'ID único de la curva',
          },
          avaliable_results: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Resultados disponibles para apostar',
          },
          sold_results: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Resultados ya vendidos',
          },
          status: {
            type: 'string',
            enum: ['open', 'closed', 'sold_out'],
            description: 'Estado de la curva',
          },
        },
      },
      SoccerTeam: {
        type: 'object',
        required: ['name', 'avatar', 'color', 'created'],
        properties: {
          _id: {
            type: 'string',
            description: 'ID único del equipo',
          },
          name: {
            type: 'string',
            description: 'Nombre del equipo',
          },
          avatar: {
            type: 'object',
            required: ['url', 'public_id'],
            properties: {
              url: {
                type: 'string',
                description: 'URL del logo/avatar',
              },
              public_id: {
                type: 'string',
                description: 'ID público del archivo',
              },
            },
          },
          color: {
            type: 'string',
            description: 'Color representativo del equipo',
          },
          created: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
        },
      },
      Ticket: {
        type: 'object',
        required: ['soccer_game_id', 'user_id', 'results_purchased', 'payed_amount', 'curva_id'],
        properties: {
          _id: {
            type: 'string',
            description: 'ID único del ticket',
          },
          ticket_number: {
            type: 'number',
            description: 'Número de boleta único',
          },
          soccer_game_id: {
            type: 'string',
            description: 'ID del partido apostado',
          },
          user_id: {
            type: 'string',
            description: 'ID del usuario que compró',
          },
          results_purchased: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Resultados apostados (formato: 0.0 a 7.7)',
            example: ['1.2', '3.0', '4.1'],
          },
          payed_amount: {
            type: 'number',
            minimum: 0,
            description: 'Cantidad apostada',
          },
          status: {
            type: 'string',
            enum: ['pending', 'won', 'lost'],
            description: 'Estado del ticket',
            default: 'pending',
          },
          curva_id: {
            type: 'string',
            description: 'ID de la curva donde se apostó',
          },
          created_date: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
        },
      },
      Player: {
        type: 'object',
        required: ['name', 'team_id', 'created_at'],
        properties: {
          _id: {
            type: 'string',
            description: 'ID único del jugador',
          },
          name: {
            type: 'string',
            description: 'Nombre completo del jugador',
          },
          team_id: {
            type: 'string',
            description: 'ID del equipo al que pertenece',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Indica si la operación fue exitosa',
          },
          message: {
            type: 'string',
            description: 'Mensaje descriptivo de la respuesta',
          },
          data: {
            type: 'object',
            description: 'Datos de respuesta (opcional)',
          },
        },
        required: ['success', 'message'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
            description: 'Siempre false para errores',
          },
          message: {
            type: 'string',
            description: 'Descripción del error',
          },
        },
        required: ['success', 'message'],
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico',
          },
          password: {
            type: 'string',
            description: 'Contraseña',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Login exitoso',
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT Token para autenticación',
              },
              user: {
                $ref: '#/components/schemas/User',
              },
            },
          },
        },
      },
      FileUpload: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Archivo a subir (máximo 5MB)',
          },
        },
        description:
          'Esquema para subida de archivos usando multipart/form-data. Límite de 5MB por archivo.',
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Endpoints de salud de la API',
    },
    {
      name: 'Users',
      description: 'Gestión de usuarios y autenticación',
    },
    {
      name: 'Games',
      description: 'Gestión de partidos de fútbol y curvas',
    },
    {
      name: 'Teams',
      description: 'Gestión de equipos de fútbol',
    },
    {
      name: 'Tickets',
      description: 'Gestión de boletas y apuestas',
    },
    {
      name: 'Players',
      description: 'Gestión de jugadores de fútbol',
    },
  ],
}

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/docs/index.swagger.ts',
    './src/docs/health.swagger.ts',
    './src/docs/users.swagger.ts',
    './src/docs/games.swagger.ts',
    './src/docs/teams.swagger.ts',
    './src/docs/tickets.swagger.ts',
    './src/docs/players.swagger.ts',
    './src/docs/webhooks.swagger.ts',
  ],
}

export const swaggerSpec = swaggerJSDoc(options)
