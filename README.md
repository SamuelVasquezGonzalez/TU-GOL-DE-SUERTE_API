# 🎯 TU GOL DE SUERTE API

Una API REST moderna construida con TypeScript, Express y MongoDB para gestionar predicciones deportivas y sistema de apuestas.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Colaboradores](#-colaboradores)
- [Licencia](#-licencia)

## ✨ Características

- 🔐 **Autenticación JWT** - Sistema de autenticación seguro
- 📱 **API RESTful** - Arquitectura REST bien estructurada
- 🗄️ **MongoDB** - Base de datos NoSQL con Mongoose
- 📧 **Sistema de Emails** - Plantillas HTML para notificaciones
- 🖼️ **Cloudinary** - Gestión y almacenamiento de imágenes
- 📝 **Logging** - Sistema de logs con Morgan
- 🔒 **Seguridad** - Encriptación con bcrypt y validaciones
- 📤 **Upload de Archivos** - Manejo de archivos con Multer
- 🚀 **TypeScript** - Desarrollo tipado y moderno

## 🛠️ Tecnologías

### Backend
- **Node.js** (>=20.0.0)
- **TypeScript** - Superset tipado de JavaScript
- **Express.js** - Framework web minimalista
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB

### Autenticación & Seguridad
- **JWT** - JSON Web Tokens para autenticación
- **bcrypt** - Hash de contraseñas
- **CORS** - Cross-Origin Resource Sharing

### Utilidades
- **Cloudinary** - Gestión de imágenes en la nube
- **Multer** - Middleware para upload de archivos
- **Morgan** - HTTP request logger
- **Day.js** - Librería de fechas ligera
- **Nodemon** - Auto-restart durante desarrollo

## 📁 Estructura del Proyecto

```
TU-GOL-DE-SUERTE_API/
├── src/                          # Código fuente principal
│   ├── auth/                     # Módulos de autenticación
│   ├── config/                   # Configuraciones de la aplicación
│   ├── contracts/                # Definiciones de tipos e interfaces
│   │   ├── interfaces/           # Interfaces TypeScript
│   │   └── types/                # Tipos personalizados
│   ├── controllers/              # Controladores de rutas
│   ├── docs/                     # Documentación de la API
│   ├── emails/                   # Sistema de correos
│   │   └── html/                 # Plantillas HTML para emails
│   ├── events/                   # Manejo de eventos
│   ├── middlewares/              # Middlewares personalizados
│   ├── models/                   # Modelos de Mongoose
│   ├── routes/                   # Definición de rutas
│   ├── services/                 # Capa de servicios
│   ├── shared/                   # Recursos compartidos
│   └── utils/                    # Utilidades helpers
├── dist/                         # Código compilado (generado)
└── node_modules/                 # Dependencias (generado)
```

### 📂 Descripción de Carpetas

| Carpeta | Descripción |
|---------|-------------|
| `auth/` | Contiene toda la lógica relacionada con autenticación, autorización, guards y strategies |
| `config/` | Configuraciones de la aplicación como conexión a BD, variables globales, etc. |
| `contracts/` | Definiciones de tipos TypeScript, interfaces y contratos de datos |
| `controllers/` | Controladores que manejan las peticiones HTTP y coordinan la respuesta |
| `docs/` | Documentación de la API, schemas y ejemplos de uso |
| `emails/` | Sistema de correos electrónicos con plantillas HTML |
| `events/` | Manejo de eventos asincrónicos y event-driven architecture |
| `middlewares/` | Middlewares personalizados para autenticación, validación, etc. |
| `models/` | Modelos de Mongoose que definen la estructura de datos en MongoDB |
| `routes/` | Definición de rutas y endpoints de la API REST |
| `services/` | Capa de servicios con lógica de negocio reutilizable |
| `shared/` | Recursos compartidos como constantes, enums y utilidades globales |
| `utils/` | Funciones utilitarias y helpers para diferentes propósitos |

## 🚀 Instalación

### Prerrequisitos

- **Node.js** >= 20.0.0
- **PNPM** (recomendado) o npm
- **MongoDB** (local o en la nube)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/TU-GOL-DE-SUERTE_API.git
   cd TU-GOL-DE-SUERTE_API
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   # Contactar con [@S4muB0t](https://github.com/S4muB0t) | Desarrollador Principal
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   pnpm run dev
   # o
   npm run dev
   ```

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm run dev` | Inicia el servidor en modo desarrollo con auto-restart |
| `pnpm run build` | Compila el proyecto TypeScript a JavaScript |
| `pnpm run start` | Ejecuta la versión compilada en producción |
| `pnpm run copy-emails` | Copia las plantillas HTML al directorio dist |
| `pnpm test` | Ejecuta las pruebas (pendiente implementación) |

## 🔧 Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

## 🔗 API Endpoints

## 👥 Colaboradores

Este proyecto ha sido desarrollado por un talentoso equipo de desarrolladores:

| Colaborador | GitHub | Rol |
|-------------|--------|-----|
| **Samuel Vasquez Gonzalez** | [@S4muB0t](https://github.com/S4muB0t) | Desarrollador Principal |
| **Alejandro Loaiza** | [@Alejo-Py](https://github.com/Alejo-Py) | Desarrollador Backend |
| **Daniel Leon** | [@Danileon0226](https://github.com/Danileon0226) | Desarrollador Backend |

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

---

<div align="center">
  <p>Desarrollado con ❤️ por el equipo de Tu Gol de Suerte</p>
  <p>© 2024 Tu Gol de Suerte API. Todos los derechos reservados.</p>
</div>
