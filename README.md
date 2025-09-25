# API Tu Gol de Suerte - Documentación de Endpoints

## Prefijo Base
Todos los endpoints llevan el prefijo: `/api/v1/`

## Autenticación
- **Customer Auth**: Token de usuario autenticado en header `Authorization: <token>`
- **Admin Auth**: Token de administrador en header `Authorization: <token>`
- **Público**: No requiere autenticación

---

# ENDPOINTS DE USUARIOS

## 📋 GET - Obtener Usuarios

### 1. Obtener todos los usuarios
**Endpoint:** `GET /api/v1/users/`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**Query Parameters (opcional):**
```typescript
{
  type_user?: "admin" | "staff" | "customer"
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User[]
}
```

---

### 2. Buscar usuarios
**Endpoint:** `GET /api/v1/users/search`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**Query Parameters (requerido):**
```typescript
{
  param: string // Busca por nombre, email, teléfono o identidad
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User[]
}
```

---

### 3. Obtener usuario por ID
**Endpoint:** `GET /api/v1/users/:id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  id: string // ID del usuario
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

### 4. Obtener perfil del usuario autenticado
**Endpoint:** `GET /api/v1/users/profile/me`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

---

### 4. Obtener perfil del usuario autenticado
**Endpoint:** `GET /api/v1/users/staff/profile/me`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <staff_token>`

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

## ➕ POST - Crear y Autenticar

### 5. Registrar nuevo usuario
**Endpoint:** `POST /api/v1/users/register`  
**Acceso:** Público

**Body (requerido):**
```typescript
{
  name: string;
  email: string;
  identity: {
    type_document: "CC" | "CE" | "TI" | "PP" | "NIT";
    number_document: string;
  };
  phone: string;
  role?: "admin" | "staff" | "customer"; // Default: "customer"
  password?: string; // Requerido para admin/staff, opcional para customer
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

### 6. Iniciar sesión
**Endpoint:** `POST /api/v1/users/login`  
**Acceso:** Público

**Body (requerido):**
```typescript
{
  email: string;
  password: string;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    access_token: string;
  }
}
```

---

### 7. Solicitar recuperación de contraseña
**Endpoint:** `POST /api/v1/users/forgot-password`  
**Acceso:** Público

**Body (requerido):**
```typescript
{
  email: string;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 8. Verificar código de recuperación
**Endpoint:** `POST /api/v1/users/verify-code`  
**Acceso:** Público

**Body (requerido):**
```typescript
{
  email: string;
  code: string; // Código numérico como string
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: any
}
```

---

## ✏️ PUT - Actualizar

### 9. Actualizar perfil de usuario
**Endpoint:** `PUT /api/v1/users/profile`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`  
**Content-Type:** `multipart/form-data`

**Body (todos opcionales):**
```typescript
{
  name?: string;
  email?: string;
  identity?: {
    type_document: "CC" | "CE" | "TI" | "PP" | "NIT";
    number_document: string;
  };
  phone?: string;
  image?: File; // Archivo de imagen
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

### 10. Cambiar contraseña
**Endpoint:** `PUT /api/v1/users/change-password`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`

**Body (requerido):**
```typescript
{
  current_password: string;
  new_password: string;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

### 11. Restablecer contraseña
**Endpoint:** `PUT /api/v1/users/reset-password`  
**Acceso:** Público

**Body (requerido):**
```typescript
{
  email?: string; // Email O identity (uno de los dos)
  identity?: {
    type_document: "CC" | "CE" | "TI" | "PP" | "NIT";
    number_document: string;
  };
  code: string; // Código numérico como string
  new_password: string;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

### 12. Subir imagen de perfil
**Endpoint:** `PUT /api/v1/users/profile/image`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`  
**Content-Type:** `multipart/form-data`

**Body (requerido):**
```typescript
{
  image: File; // Archivo de imagen
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

## 🗑️ DELETE - Eliminar

### 13. Eliminar usuario
**Endpoint:** `DELETE /api/v1/users/:id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  id: string; // ID del usuario a eliminar
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 14. Eliminar imagen de perfil
**Endpoint:** `DELETE /api/v1/users/profile/image`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: User
}
```

---

## 📝 Notas Importantes

### Tipos de Usuario
- **admin**: Administrador del sistema
- **staff**: Personal de la empresa
- **customer**: Usuario cliente (default)

### Tipos de Documento de Identidad
- **CC**: Cédula de Ciudadanía
- **CE**: Cédula de Extranjería  
- **TI**: Tarjeta de Identidad
- **PP**: Pasaporte
- **NIT**: Número de Identificación Tributaria

### Estructura de Usuario
```typescript
{
  _id: string;
  name: string;
  email: string;
  identity: {
    type_document: "CC" | "CE" | "TI" | "PP" | "NIT";
    number_document: string;
  };
  phone: string;
  role: "admin" | "staff" | "customer";
  pin?: number;
  avatar?: {
    url: string;
    public_id: string;
  };
  created_at: Date;
}
```

---

# ENDPOINTS DE TICKETS

## 📋 GET - Obtener Tickets

### 1. Obtener mis tickets (usuario autenticado)
**Endpoint:** `GET /api/v1/tickets/my-tickets`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Ticket[]
}
```

---

### 2. Obtener ticket por ID
**Endpoint:** `GET /api/v1/tickets/:id`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`

**URL Parameters:**
```typescript
{
  id: string // ID del ticket
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    ticket: Ticket;
    game: SoccerGame;
    curva: CurvaEntity;
    customer: User;
  }
}
```

---

### 3. Obtener todos los tickets
**Endpoint:** `GET /api/v1/tickets/`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Ticket[]
}
```

---

### 4. Obtener tickets por usuario
**Endpoint:** `GET /api/v1/tickets/user/:user_id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  user_id: string // ID del usuario
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Ticket[]
}
```

---

### 5. Obtener tickets por juego
**Endpoint:** `GET /api/v1/tickets/game/:game_id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  game_id: string // ID del juego
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Ticket[]
}
```

---

### 6. Obtener tickets por curva
**Endpoint:** `GET /api/v1/tickets/curva/:curva_id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  curva_id: string // ID de la curva
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Ticket[]
}
```

---

## ➕ POST - Crear Tickets

### 7. Crear ticket (como customer)
**Endpoint:** `POST /api/v1/tickets/`  
**Acceso:** Customer autenticado  
**Headers:** `Authorization: <customer_token>`

**Body (requerido):**
```typescript
{
  game_id: string;       // ID del juego
  curva_id?: string;     // ID de curva específica (opcional)
  quantity: number;      // Cantidad de resultados a comprar
  ticket_price: number;  // Precio por resultado
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: any // Información del ticket creado
}
```

---

### 8. Crear ticket (como admin)
**Endpoint:** `POST /api/v1/tickets/admin`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**Body (requerido):**
```typescript
{
  game_id: string;       // ID del juego
  customer_id: string;   // ID del customer para quien crear el ticket
  curva_id?: string;     // ID de curva específica (opcional)
  quantity: number;      // Cantidad de resultados a comprar
  ticket_price: number;  // Precio por resultado
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: any // Información del ticket creado
}
```

---

## ✏️ PUT - Actualizar Tickets

### 9. Cambiar estado del ticket
**Endpoint:** `PUT /api/v1/tickets/:id/status`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  id: string // ID del ticket
}
```

**Body (requerido):**
```typescript
{
  status: "pending" | "won" | "lost"
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 📝 Notas Importantes para Tickets

### Estados de Ticket
- **pending**: Ticket pendiente de resultado
- **won**: Ticket ganador
- **lost**: Ticket perdedor

### Estructura de Ticket
```typescript
{
  _id: string;
  ticket_number: number;    // Número único de boleta
  soccer_game_id: string;   // ID del partido
  user_id: string;          // ID del usuario propietario
  results_purchased: string[]; // Resultados comprados (ej: ["0.0", "1.1", "2.2"])
  payed_amount: number;     // Cantidad total pagada
  status: "pending" | "won" | "lost";
  curva_id: string;         // ID de la curva donde se compraron
  created_date: Date;       // Fecha de creación
}
```

### Lógica de Creación de Tickets
- Si no se especifica `curva_id`, el sistema selecciona automáticamente una curva disponible
- Los resultados se asignan aleatoriamente de los disponibles en la curva
- Si una curva se queda sin resultados disponibles, cambia su estado a "sold_out"
- Se envía email de confirmación de compra automáticamente
- Se genera un número de boleta único automáticamente

### Token de Autorización
El token debe enviarse en el header `Authorization` sin el prefijo `Bearer`:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

# ENDPOINTS DE EQUIPOS

## 📋 GET - Obtener Equipos

### 1. Obtener todos los equipos
**Endpoint:** `GET /api/v1/teams/`  
**Acceso:** Público

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerTeam[]
}
```

---

### 2. Buscar equipos por nombre
**Endpoint:** `GET /api/v1/teams/search`  
**Acceso:** Público

**Query Parameters (requerido):**
```typescript
{
  name: string // Nombre del equipo a buscar
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerTeam
}
```

---

### 3. Obtener equipo por ID
**Endpoint:** `GET /api/v1/teams/:id`  
**Acceso:** Público

**URL Parameters:**
```typescript
{
  id: string // ID del equipo
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerTeam
}
```

---

## ➕ POST - Crear Equipos

### 4. Crear nuevo equipo
**Endpoint:** `POST /api/v1/teams/`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`  
**Content-Type:** `multipart/form-data`

**Body (requerido):**
```typescript
{
  name: string;     // Nombre del equipo (único)
  color: string;    // Color principal del equipo (ej: "#FF0000", "red")
  image: File;      // Archivo de imagen/logo del equipo (requerido)
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerTeam
}
```

---

## ✏️ PUT - Actualizar Equipos

### 5. Actualizar equipo
**Endpoint:** `PUT /api/v1/teams/:id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`  
**Content-Type:** `multipart/form-data`

**URL Parameters:**
```typescript
{
  id: string // ID del equipo a actualizar
}
```

**Body (todos opcionales):**
```typescript
{
  name?: string;    // Nuevo nombre del equipo
  color?: string;   // Nuevo color del equipo
  image?: File;     // Nueva imagen/logo del equipo
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerTeam
}
```

---

## 🗑️ DELETE - Eliminar Equipos

### 6. Eliminar equipo
**Endpoint:** `DELETE /api/v1/teams/:id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  id: string // ID del equipo a eliminar
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 📝 Notas Importantes para Equipos

### Estructura de Equipo
```typescript
{
  _id: string;
  name: string;          // Nombre único del equipo
  color: string;         // Color principal (hex, nombre, etc.)
  avatar: {              // Logo/imagen del equipo
    url: string;         // URL de la imagen en Cloudinary
    public_id: string;   // ID público para gestión en Cloudinary
  };
  created: Date;         // Fecha de creación
}
```

### Validaciones Importantes
- **Nombre único**: No pueden existir dos equipos con el mismo nombre
- **Imagen obligatoria**: Al crear un equipo, la imagen es requerida
- **Gestión de imágenes**: Al actualizar/eliminar, las imágenes anteriores se eliminan automáticamente de Cloudinary

### Gestión de Archivos
- **Tipos soportados**: Imágenes (JPG, PNG, etc.)
- **Almacenamiento**: Cloudinary
- **Límites**: Según configuración del middleware de upload
- **Eliminación automática**: Al actualizar o eliminar equipos

---

# ENDPOINTS DE JUGADORES

## 📋 GET - Obtener Jugadores

### 1. Obtener todos los jugadores
**Endpoint:** `GET /api/v1/players/`  
**Acceso:** Público

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Player[]
}
```

---

### 2. Buscar jugadores por nombre
**Endpoint:** `GET /api/v1/players/search`  
**Acceso:** Público

**Query Parameters (requerido):**
```typescript
{
  name: string // Nombre del jugador a buscar (búsqueda parcial)
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Player[]
}
```

---

### 3. Obtener jugadores por equipo
**Endpoint:** `GET /api/v1/players/team/:team_id`  
**Acceso:** Público

**URL Parameters:**
```typescript
{
  team_id: string // ID del equipo
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Player[]
}
```

---

### 4. Obtener jugador por ID
**Endpoint:** `GET /api/v1/players/:id`  
**Acceso:** Público

**URL Parameters:**
```typescript
{
  id: string // ID del jugador
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Player
}
```

---

## ➕ POST - Crear Jugadores

### 5. Crear nuevo jugador
**Endpoint:** `POST /api/v1/players/`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**Body (requerido):**
```typescript
{
  name: string;     // Nombre del jugador
  team_id: string;  // ID del equipo al que pertenecerá
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Player
}
```

---

## ✏️ PUT - Actualizar Jugadores

### 6. Actualizar jugador
**Endpoint:** `PUT /api/v1/players/:id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  id: string // ID del jugador a actualizar
}
```

**Body (al menos uno requerido):**
```typescript
{
  name?: string;     // Nuevo nombre del jugador
  team_id?: string;  // Nuevo equipo del jugador
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: Player
}
```

---

## 🗑️ DELETE - Eliminar Jugadores

### 7. Eliminar jugador
**Endpoint:** `DELETE /api/v1/players/:id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  id: string // ID del jugador a eliminar
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 8. Eliminar todos los jugadores de un equipo
**Endpoint:** `DELETE /api/v1/players/team/:team_id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  team_id: string // ID del equipo
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    deleted_count: number; // Cantidad de jugadores eliminados
  }
}
```

---

## 📝 Notas Importantes para Jugadores

### Estructura de Jugador
```typescript
{
  _id: string;
  name: string;        // Nombre del jugador
  team_id: string;     // ID del equipo al que pertenece
  created_at: Date;    // Fecha de creación
}
```

### Validaciones Importantes
- **Equipo existente**: Antes de crear/actualizar, se verifica que el equipo exista
- **Nombre único por equipo**: No pueden existir dos jugadores con el mismo nombre en el mismo equipo
- **Búsqueda flexible**: La búsqueda por nombre es case-insensitive y permite coincidencias parciales

### Reglas de Negocio
- **Nombres únicos**: Un equipo no puede tener dos jugadores con el mismo nombre (case-insensitive)
- **Transferencias**: Al cambiar el team_id de un jugador, se valida que no exista otro jugador con el mismo nombre en el equipo destino
- **Eliminación masiva**: Al eliminar por equipo, se retorna la cantidad de jugadores eliminados

---

# ENDPOINTS DE JUEGOS

## 📋 GET - Obtener Juegos y Curvas

### 1. Obtener todos los juegos
**Endpoint:** `GET /api/v1/games/`  
**Acceso:** Público

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerGame[]
}
```

---

### 2. Buscar juegos por fecha
**Endpoint:** `GET /api/v1/games/search/date`  
**Acceso:** Público

**Query Parameters (requerido):**
```typescript
{
  date: string // Fecha en formato ISO (ej: "2024-01-15T00:00:00.000Z")
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerGame
}
```

---

### 3. Obtener juego por ID
**Endpoint:** `GET /api/v1/games/:id`  
**Acceso:** Público

**URL Parameters:**
```typescript
{
  id: string // ID del juego
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerGame
}
```

---

### 4. Obtener juegos por torneo
**Endpoint:** `GET /api/v1/games/tournament/:tournament`  
**Acceso:** Público

**URL Parameters:**
```typescript
{
  tournament: string // Nombre del torneo
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerGame
}
```

---

### 5. Obtener información de una curva específica
**Endpoint:** `GET /api/v1/games/:game_id/curva/:curva_id`  
**Acceso:** Público

**URL Parameters:**
```typescript
{
  game_id: string;  // ID del juego
  curva_id: string; // ID de la curva
}
```

**Query Parameters (opcional):**
```typescript
{
  include_game?: boolean // Si es 'true', incluye información completa del juego
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    game_id: string;
    curva: CurvaEntity;
    game: SoccerGame | null; // Solo si include_game=true
  }
}
```

---

## ➕ POST - Crear Juegos y Abrir Curvas

### 6. Crear nuevo juego
**Endpoint:** `POST /api/v1/games/`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**Body (requerido):**
```typescript
{
  soccer_teams: [string, string]; // Array con exactamente 2 IDs de equipos [local, visitante]
  start_date: string;             // Fecha de inicio (ISO format)
  end_time: string;               // Fecha/hora de finalización (ISO format)
  status: "pending" | "in_progress" | "finished";
  tournament: string;             // Nombre del torneo
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: SoccerGame
}
```

---

### 7. Abrir nueva curva en un juego
**Endpoint:** `POST /api/v1/games/:game_id/curva`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  game_id: string // ID del juego
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    status: boolean;
    curva: CurvaEntity;
  }
}
```

---

## ✏️ PUT - Actualizar Juegos y Curvas

### 8. Actualizar marcador del juego
**Endpoint:** `PUT /api/v1/games/:game_id/score`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  game_id: string // ID del juego
}
```

**Body (requerido):**
```typescript
{
  score: [number, number] // Marcador [goles_local, goles_visitante]
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 9. Actualizar resultados de una curva
**Endpoint:** `PUT /api/v1/games/:game_id/curva/:curva_id`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  game_id: string;  // ID del juego
  curva_id: string; // ID de la curva
}
```

**Body (requerido):**
```typescript
{
  curva_updated: {
    id: string;
    avaliable_results: string[];  // Resultados disponibles para compra
    sold_results: string[];       // Resultados ya vendidos
    status: "open" | "closed" | "sold_out";
  }
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 10. Cerrar una curva específica
**Endpoint:** `PUT /api/v1/games/:game_id/curva/:curva_id/close`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  game_id: string;  // ID del juego
  curva_id: string; // ID de la curva a cerrar
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### 11. Finalizar juego
**Endpoint:** `PUT /api/v1/games/:game_id/end`  
**Acceso:** Solo Admin  
**Headers:** `Authorization: <admin_token>`

**URL Parameters:**
```typescript
{
  game_id: string // ID del juego a finalizar
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## 📝 Notas Importantes para Juegos

### Estructura de Juego (SoccerGame)
```typescript
{
  _id: string;
  created_date: Date;                    // Fecha de creación
  soccer_teams: [string, string];       // IDs de equipos [local, visitante]
  start_date: Date;                      // Fecha y hora de inicio
  end_time: Date;                        // Fecha y hora de finalización
  status: "pending" | "in_progress" | "finished";
  score: [number, number];               // Marcador [goles_local, goles_visitante]
  tournament: string;                    // Nombre del torneo
  curvas_open: CurvaEntity[];           // Array de curvas disponibles
}
```

### Estructura de Curva (CurvaEntity)
```typescript
{
  id: string;                           // UUID único de la curva
  avaliable_results: string[];          // Resultados disponibles (ej: ["0.0", "1.1", "2.2"])
  sold_results: string[];               // Resultados ya vendidos
  status: "open" | "closed" | "sold_out";
}
```

### Estados de Juego
- **pending**: Juego programado, aún no inicia
- **in_progress**: Juego en curso
- **finished**: Juego terminado

### Estados de Curva
- **open**: Curva disponible para compras
- **closed**: Curva cerrada manualmente
- **sold_out**: Curva agotada (64 resultados vendidos)

### Sistema de Curvas - Lógica de Negocio
1. **64 resultados únicos**: Cada curva genera exactamente 64 resultados posibles (0.0 a 7.7)
2. **Resultados aleatorios**: Se generan automáticamente sin duplicados
3. **Venta automática**: Al venderse los 64 resultados, la curva cambia a "sold_out"
4. **Curvas múltiples**: Se pueden abrir nuevas curvas cuando la anterior se agota
5. **Formato de resultados**: "X.Y" donde X y Y van de 0 a 7 (ej: "2.3", "0.0", "7.7")

### Flujo Completo del Sistema
1. **Crear juego**: Se crea con una curva inicial automáticamente
2. **Vender tickets**: Los usuarios compran resultados de las curvas abiertas
3. **Abrir nuevas curvas**: Cuando se agota una curva, admin puede abrir otra
4. **Actualizar marcador**: Durante el juego se actualiza el score
5. **Finalizar juego**: Al terminar, se marcan automáticamente los tickets ganadores/perdedores
6. **Cerrar curvas**: Todas las curvas se cierran al finalizar el juego

### Validaciones Importantes
- **Equipos únicos**: No pueden existir dos juegos activos con los mismos equipos
- **Marcador válido**: Debe ser un array de exactamente 2 números
- **Fechas coherentes**: start_date debe ser anterior a end_time
- **Estados válidos**: Solo se pueden hacer transiciones lógicas entre estados

### Códigos de Estado HTTP
- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Error en los datos enviados
- **401**: No autorizado
- **404**: Recurso no encontrado
- **500**: Error interno del servidor
