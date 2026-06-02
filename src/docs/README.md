# 📚 Documentación La Banda de Crisma API

Esta carpeta contiene toda la documentación relacionada con la API.

## 📁 Estructura

```
docs/
├── README.md           # Este archivo
├── swagger.config.ts   # Configuración de Swagger/OpenAPI
└── ...                 # Otros archivos de documentación
```

## 🔧 Configuración de Swagger

El archivo `swagger.config.ts` contiene:

- **Definiciones de esquemas**: Tipos de datos para User, SoccerGame, Ticket, etc.
- **Configuración de seguridad**: TokenAuth para JWT
- **Información de la API**: Título, versión, descripción
- **Servidores**: URLs de desarrollo y local
- **Tags**: Organización de endpoints por módulos

## 🌐 Acceder a la documentación

Una vez que la API esté corriendo, puedes acceder a la documentación interactiva en:

- **Swagger UI**: `http://localhost:{PORT}/api-docs`
- **JSON Spec**: `http://localhost:{PORT}/api-docs.json`

## 📝 Cómo usar

1. **Desarrollo**: Los comentarios JSDoc en los archivos de rutas se generan automáticamente
2. **Producción**: La documentación está disponible en tiempo real
3. **Testing**: Puedes probar los endpoints directamente desde la interfaz de Swagger

## 🔐 Autenticación

La API usa un sistema de autenticación con JWT:

```
Authorization: {token}
```

**⚠️ Importante**: NO uses "Bearer" en el header, solo el token directamente.

## 🏷️ Tags Disponibles

- **Health**: Endpoints de salud de la API
- **Users**: Gestión de usuarios y autenticación  
- **Games**: Gestión de partidos de fútbol y curvas
- **Teams**: Gestión de equipos de fútbol
- **Tickets**: Gestión de boletas y apuestas

---

**✨ Documentación generada automáticamente con Swagger/OpenAPI 3.0**
