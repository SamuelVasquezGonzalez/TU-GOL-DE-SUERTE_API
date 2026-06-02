# 📖 Ejemplos de Uso - La Banda de Crisma API

## 🔐 Autenticación

### Header de Autorización

```bash
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: NO usar "Bearer", solo el token directamente.

## 👥 Usuarios

### Registro de Usuario

```json
POST /v1/api/users/register
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "identity": {
    "type_document": "CC",
    "number_document": "12345678"
  },
  "phone": "+573001234567",
  "role": "customer"
}
```

### Login

```json
POST /v1/api/users/login
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "customer"
    }
  }
}
```

## ⚽ Partidos

### Crear Partido (Admin)

```json
POST /v1/api/games
Authorization: {admin-token}
{
  "soccer_teams": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "start_date": "2023-12-01T15:00:00.000Z",
  "end_time": "2023-12-01T17:00:00.000Z",
  "status": "pending",
  "tournament": "Liga Profesional",
  "soccer_price": 50000
}
```

### Obtener Partidos por Fecha

```bash
GET /v1/api/games/search/date?date=2023-12-01T15:00:00.000Z
```

### Actualizar Marcador (Admin)

```json
PUT /v1/api/games/{game_id}/score
Authorization: {admin-token}
{
  "score": [2, 1]
}
```

## 🏆 Equipos

### Crear Equipo (Admin)

```json
POST /v1/api/teams
Authorization: {admin-token}
{
  "name": "Real Madrid",
  "country": "España",
  "league": "La Liga"
}
```

### Subir Logo de Equipo (Admin)

```bash
PUT /v1/api/teams/{id}/logo
Authorization: {admin-token}
Content-Type: multipart/form-data
logo: [archivo de imagen]
```

## 🎫 Tickets

### Crear Ticket de Apuesta

```json
POST /v1/api/tickets
Authorization: {customer-token}
{
  "game_id": "507f1f77bcf86cd799439011",
  "curva_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 1
}
```

### Obtener Mis Tickets

```bash
GET /v1/api/tickets/my-tickets
Authorization: {customer-token}
```

### Cambiar Estado de Ticket (Admin)

```json
PUT /v1/api/tickets/{id}/status
Authorization: {admin-token}
{
  "status": "won"
}
```

## 📊 Respuestas Estándar

### Éxito

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    /* datos */
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## 🎯 Conceptos Importantes

### Curvas de Apuestas

- **64 boletas por curva**: Cada curva tiene exactamente 64 posibles resultados
- **Formato de resultados**: "0.0" a "7.7" (goles local.visitante)
- **Estados**: `open`, `closed`, `sold_out`

### Estados de Tickets

- **pending**: Esperando resultado del partido
- **won**: Ganador, resultado coincide
- **lost**: Perdedor, resultado no coincide

### Roles de Usuario

- **customer**: Usuario regular, puede comprar tickets
- **admin**: Administrador, acceso completo
- **staff**: Personal, permisos limitados

---

**💡 Consejo**: Usa la interfaz de Swagger en `/api-docs` para probar los endpoints interactivamente.
