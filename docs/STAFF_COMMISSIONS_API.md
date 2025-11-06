# API de Historial de Comisiones de Staff

## Descripción General

Sistema de histórico de comisiones para staff que calcula automáticamente las comisiones de ventas físicas cuando se finaliza un partido. Las comisiones se calculan basándose en las boletas vendidas físicamente (ventas que no pasaron por Wompi).

## Lógica de Negocio

### Identificación de Ventas Físicas

Una venta física se identifica cuando:
- El ticket tiene el campo `sell_by` (ID del staff que vendió)
- El ticket NO tiene `wompi_transaction_id` (no pasó por Wompi)

### Fórmula de Comisión

```
Comisión del Staff = (Monto Total Vendido × 2.5%) - (Número de Boletas × 700)
```

Donde:
- **Monto Total Vendido**: Suma de todos los `payed_amount` de las boletas físicas vendidas por el staff en el partido
- **2.5%**: Porcentaje de comisión del staff
- **700**: Costo fijo por cada transacción (cada boleta)
- **Comisión Neta**: Resultado final que recibe el staff

### Comisión de Wompi (Informativa)

```
Comisión de Wompi = Monto Total Vendido × 19%
```

Esta comisión es solo informativa y no afecta el cálculo de la comisión del staff.

### Proceso Automático

Cuando se finaliza un partido mediante el endpoint `POST /v1/api/games/:game_id/end`, el sistema:
1. Identifica todas las boletas físicas vendidas en ese partido
2. Agrupa las boletas por staff (`sell_by`)
3. Calcula las comisiones para cada staff
4. Guarda el histórico en la base de datos

## Estructura de Datos

### StaffCommissionHistory

```typescript
{
  _id: string
  staff_id: string                    // ID del staff que vendió
  staff_name: string                   // Nombre del staff
  staff_email: string                  // Email del staff
  soccer_game_id: string               // ID del partido
  game_date?: Date                     // Fecha del partido (opcional)
  total_tickets_sold: number           // Número total de boletas vendidas físicamente
  total_amount_sold: number            // Monto total vendido (suma de payed_amount)
  commission_percentage: number        // Porcentaje de comisión (2.5)
  commission_amount: number            // Monto de comisión antes de descuentos
  transaction_cost: number             // Costo por transacción (700)
  total_transaction_costs: number      // Costo total de transacciones
  net_commission: number               // Comisión neta del staff
  wompi_commission_percentage: number   // Porcentaje de comisión de Wompi (19)
  wompi_commission_amount: number       // Monto de comisión de Wompi (informativo)
  created_at: Date                      // Fecha y hora de creación del registro
  game_finished_at: Date                // Fecha y hora en que se finalizó el partido
}
```

## Endpoints

### Base URL
```
/v1/api/commissions
```

### Autenticación

Todos los endpoints requieren autenticación mediante Bearer Token en el header:
```
Authorization: Bearer <token>
```

- **Staff endpoints**: Requieren token de staff o admin
- **Admin endpoints**: Requieren token de admin

---

## Endpoints para Staff

### 1. Obtener Todas las Comisiones del Staff Autenticado

**Endpoint:** `GET /v1/api/commissions/my`

**Autenticación:** `staff_auth` (staff o admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros:** Ninguno

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Comisiones del staff obtenidas exitosamente",
  "data": {
    "commissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "staff_id": "507f191e810c19729de860ea",
        "staff_name": "Juan Pérez",
        "staff_email": "juan@example.com",
        "soccer_game_id": "507f1f77bcf86cd799439012",
        "total_tickets_sold": 10,
        "total_amount_sold": 50000,
        "commission_percentage": 2.5,
        "commission_amount": 1250,
        "transaction_cost": 700,
        "total_transaction_costs": 7000,
        "net_commission": -5750,
        "wompi_commission_percentage": 19,
        "wompi_commission_amount": 9500,
        "created_at": "2024-01-15T10:30:00.000Z",
        "game_finished_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totals": {
      "total_net_commission": 15000,
      "total_tickets_sold": 50,
      "total_amount_sold": 250000
    }
  }
}
```

**Errores:**
- `401`: No autorizado (token inválido o no es staff)
- `500`: Error interno del servidor

---

### 2. Obtener Comisión del Staff por Partido Específico

**Endpoint:** `GET /v1/api/commissions/my/game/:game_id`

**Autenticación:** `staff_auth` (staff o admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros de URL:**
- `game_id` (string, requerido): ID del partido

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Comisión del staff por partido obtenida exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "staff_id": "507f191e810c19729de860ea",
    "staff_name": "Juan Pérez",
    "staff_email": "juan@example.com",
    "soccer_game_id": "507f1f77bcf86cd799439012",
    "total_tickets_sold": 10,
    "total_amount_sold": 50000,
    "commission_percentage": 2.5,
    "commission_amount": 1250,
    "transaction_cost": 700,
    "total_transaction_costs": 7000,
    "net_commission": -5750,
    "wompi_commission_percentage": 19,
    "wompi_commission_amount": 9500,
    "created_at": "2024-01-15T10:30:00.000Z",
    "game_finished_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errores:**
- `400`: El ID del partido es requerido
- `401`: No autorizado
- `404`: No se encontró comisión para este staff en este partido
- `500`: Error interno del servidor

---

## Endpoints para Admin

### 3. Obtener Todas las Comisiones de Todos los Staff

**Endpoint:** `GET /v1/api/commissions/all`

**Autenticación:** `admin_auth` (solo admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `game_id` (string, opcional): Filtrar por ID de partido específico

**Ejemplo:**
```
GET /v1/api/commissions/all?game_id=507f1f77bcf86cd799439012
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Todas las comisiones obtenidas exitosamente",
  "data": {
    "commissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "staff_id": "507f191e810c19729de860ea",
        "staff_name": "Juan Pérez",
        "staff_email": "juan@example.com",
        "soccer_game_id": "507f1f77bcf86cd799439012",
        "total_tickets_sold": 10,
        "total_amount_sold": 50000,
        "commission_percentage": 2.5,
        "commission_amount": 1250,
        "transaction_cost": 700,
        "total_transaction_costs": 7000,
        "net_commission": -5750,
        "wompi_commission_percentage": 19,
        "wompi_commission_amount": 9500,
        "created_at": "2024-01-15T10:30:00.000Z",
        "game_finished_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "staff_totals": [
      {
        "staff_id": "507f191e810c19729de860ea",
        "staff_name": "Juan Pérez",
        "staff_email": "juan@example.com",
        "total_net_commission": 15000,
        "total_tickets_sold": 50,
        "total_amount_sold": 250000,
        "commissions_count": 5
      }
    ]
  }
}
```

**Errores:**
- `401`: No autorizado (no es admin)
- `500`: Error interno del servidor

---

### 4. Obtener Comisiones Agrupadas por Partido

**Endpoint:** `GET /v1/api/commissions/game/:game_id`

**Autenticación:** `admin_auth` (solo admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros de URL:**
- `game_id` (string, requerido): ID del partido

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Comisiones por partido obtenidas exitosamente",
  "data": {
    "game_id": "507f1f77bcf86cd799439012",
    "commissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "staff_id": "507f191e810c19729de860ea",
        "staff_name": "Juan Pérez",
        "staff_email": "juan@example.com",
        "soccer_game_id": "507f1f77bcf86cd799439012",
        "total_tickets_sold": 10,
        "total_amount_sold": 50000,
        "commission_percentage": 2.5,
        "commission_amount": 1250,
        "transaction_cost": 700,
        "total_transaction_costs": 7000,
        "net_commission": -5750,
        "wompi_commission_percentage": 19,
        "wompi_commission_amount": 9500,
        "created_at": "2024-01-15T10:30:00.000Z",
        "game_finished_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totals": {
      "total_net_commission": 50000,
      "total_tickets_sold": 200,
      "total_amount_sold": 1000000,
      "staff_count": 5
    }
  }
}
```

**Errores:**
- `400`: El ID del partido es requerido
- `401`: No autorizado (no es admin)
- `500`: Error interno del servidor

---

### 5. Obtener Comisiones de un Staff Específico

**Endpoint:** `GET /v1/api/commissions/staff/:staff_id`

**Autenticación:** `admin_auth` (solo admin)

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros de URL:**
- `staff_id` (string, requerido): ID del staff

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Comisiones del staff obtenidas exitosamente",
  "data": {
    "commissions": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "staff_id": "507f191e810c19729de860ea",
        "staff_name": "Juan Pérez",
        "staff_email": "juan@example.com",
        "soccer_game_id": "507f1f77bcf86cd799439012",
        "total_tickets_sold": 10,
        "total_amount_sold": 50000,
        "commission_percentage": 2.5,
        "commission_amount": 1250,
        "transaction_cost": 700,
        "total_transaction_costs": 7000,
        "net_commission": -5750,
        "wompi_commission_percentage": 19,
        "wompi_commission_amount": 9500,
        "created_at": "2024-01-15T10:30:00.000Z",
        "game_finished_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totals": {
      "total_net_commission": 15000,
      "total_tickets_sold": 50,
      "total_amount_sold": 250000
    }
  }
}
```

**Errores:**
- `400`: El ID del staff es requerido
- `401`: No autorizado (no es admin)
- `500`: Error interno del servidor

---

## Códigos de Estado HTTP

- `200`: Solicitud exitosa
- `400`: Error en los parámetros de la solicitud
- `401`: No autorizado (token inválido o rol incorrecto)
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

## Estructura de Respuesta de Error

```json
{
  "success": false,
  "message": "Descripción del error"
}
```

## Notas Técnicas

1. **Cálculo Automático**: Las comisiones se calculan automáticamente cuando se finaliza un partido mediante `POST /v1/api/games/:game_id/end`

2. **Ventas Físicas**: Solo se consideran las boletas que tienen `sell_by` y NO tienen `wompi_transaction_id`

3. **Actualización de Registros**: Si ya existe un registro de comisión para un staff y partido, se actualiza en lugar de crear uno nuevo

4. **Ordenamiento**: 
   - Las comisiones se ordenan por `game_finished_at` descendente (más recientes primero)
   - Las comisiones por partido se ordenan por `staff_name` ascendente

5. **Índices de Base de Datos**: Los siguientes índices están creados para optimizar las consultas:
   - `staff_id`
   - `soccer_game_id`
   - `staff_id + soccer_game_id` (compuesto)
   - `created_at` (descendente)
   - `game_finished_at` (descendente)

