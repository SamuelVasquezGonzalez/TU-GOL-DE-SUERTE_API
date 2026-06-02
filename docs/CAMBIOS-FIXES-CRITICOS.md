# Cambios — Fixes críticos (2026-06-02)

> Documento de traspaso para integrar/entender los 5 fixes aplicados en esta tanda.
> Pensado para que un futuro dev (o IA) sepa qué se añadió, modificó o eliminó, por qué,
> y qué contratos de API cambiaron (incluyendo **breaking changes** para el frontend).

## Contexto

`La Banda de Crisma API` es una API de lotería deportiva de fútbol (Express 5 + TypeScript +
Mongoose/MongoDB, Redis + Bull para colas, Socket.io tiempo real, pagos vía Wompi). El usuario
compra boletas con resultados aleatorios (marcadores `0.0`–`7.7`) tomados de "curvas" (lotes de
64 resultados). Al finalizar el partido el marcador real define ganadores; si el marcador es >7
o no hay acertantes, gana la casa. Hay 3 roles: `admin`, `staff`, `customer`.

Esta tanda corrige **5 problemas** (4 bugs/seguridad + 1 de rendimiento/escala). No se tocó la
lógica de negocio (precios, recompensas, comisiones, emails, webhooks de Wompi).

---

## Resumen de los 5 fixes

| # | Problema | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | Rutas de perfil inaccesibles por middlewares de auth encadenados | 🔴 Bug funcional | ✅ |
| 2 | Condición de carrera al vender boletas (doble venta del mismo número) | 🔴 Correctitud / dinero | ✅ |
| 3 | `created_at` igual para todos los usuarios | 🟠 Bug de datos | ✅ |
| 4 | Sin paginación + N+1 en listados | 🟠 Rendimiento/escala | ✅ |
| 5 | Escalada de privilegios en el registro público | 🔴 Seguridad | ✅ |

---

## Fix 1 — Middleware de autorización combinado

**Problema:** En [`src/routes/user.routes.ts`](../src/routes/user.routes.ts) varias rutas
encadenaban `customer_auth, staff_auth` (o `admin_auth, staff_auth`). Express ejecuta **todos**
los middlewares en serie, así que exigía cumplir **ambos** roles a la vez. Como un usuario tiene
un único rol, esas rutas eran **inaccesibles para todos** (`/profile`, `/change-password`,
`/reset-password`, `/profile/image`).

**Solución:**
- **NUEVO** archivo [`src/auth/role.auth.ts`](../src/auth/role.auth.ts): middleware factory
  `authorize(...roles)` que deja pasar si el rol del token está en la lista. Si no se pasan
  roles, sólo exige token válido. Además soporta el header `Authorization: Bearer <token>` y
  el token "a secas" (los middlewares viejos sólo aceptaban el token sin prefijo).
- **MODIFICADO** `src/routes/user.routes.ts`: las rutas de perfil ahora usan
  `authorize("customer", "staff", "admin")`.

**Cambios de comportamiento / API:**
- `PUT /v1/api/users/reset-password` pasó a ser **pública** (antes estaba —erróneamente— tras
  auth). Es la finalización del flujo "olvidé mi contraseña" (requiere el código de recuperación),
  consistente con `forgot-password` y `verify-code`, que ya eran públicas.
- Las demás rutas de perfil ahora **sí funcionan** para cualquier usuario autenticado sobre su
  propio perfil.

**Nota:** los middlewares antiguos `admin_auth`, `staff_auth`, `customer_auth` siguen existiendo
y se usan en otras rutas. No se eliminaron. `customer_auth` ya no se importa en `user.routes.ts`.
Migración recomendada (futuro): reemplazar progresivamente los 3 por `authorize(...)`.

---

## Fix 2 — Condición de carrera al vender boletas (atomicidad)

**Problema:** En [`src/services/ticket.service.ts`](../src/services/ticket.service.ts)
`create_new_ticket` hacía un patrón **leer → elegir números aleatorios en memoria → reescribir
el array completo** de la curva (`update_curva_results`). Sin transacción ni atomicidad, dos
compras concurrentes podían **asignar el MISMO número a dos boletas distintas** → dos "ganadores"
del mismo resultado. Crítico en un sistema con dinero.

**Solución:**
- **NUEVO** método `claim_random_result_atomic({ game_id, curva_id })` en
  [`src/services/soccer_game.service.ts`](../src/services/soccer_game.service.ts): reclama **un**
  resultado aleatorio con una sola operación atómica condicionada:
  ```js
  findOneAndUpdate(
    { _id: game_id, curvas_open: { $elemMatch: { id: curva_id, avaliable_results: random_result } } },
    { $pull: { "curvas_open.$[c].avaliable_results": random_result },
      $push: { "curvas_open.$[c].sold_results": random_result } },
    { arrayFilters: [{ "c.id": curva_id }], new: true }
  )
  ```
  Si otra compra ya tomó ese número, el `$elemMatch` no coincide → `update_result === null` →
  reintenta con otro número (hasta `MAX_RETRIES = 100`). Devuelve `string` (resultado) o `null`
  (curva agotada / demasiados conflictos).
- **NUEVO** método privado `mark_curva_sold_out(...)`: marca la curva como `sold_out` cuando se
  vacía (con `updateOne` posicional).
- **MODIFICADO** el bucle de compra de `create_new_ticket`: ahora reclama **un número a la vez**
  de forma atómica, abriendo nuevas curvas si la actual se agota, con una **cota de seguridad**
  (`SAFETY_MAX = quantity * 50 + 200`) para evitar bucles infinitos. Lee sólo `curvas_open`
  (`.select('curvas_open')`) en cada iteración en lugar de hacer joins de equipos/torneo.
- **NUEVO import** en `ticket.service.ts`: `SoccerGameModel`.

**Notas / limitaciones:**
- `update_curva_results` sigue existiendo (lo usan otros flujos), pero **ya no se usa** en la
  compra de boletas.
- El precio total (`payed_amount = soccer_price * quantity`) y el resto del flujo (email de
  compra, comisión de staff, broadcast de socket) **no cambiaron**.
- Esto resuelve la atomicidad **por número**. Para atomicidad de extremo a extremo del pago
  (idempotencia total del webhook) ver "Pendientes".

---

## Fix 3 — `created_at` de usuarios

**Problema:** En [`src/models/user.model.ts`](../src/models/user.model.ts) el campo era
`default: new Date()`. Esa expresión se evalúa **una sola vez** al cargar el módulo, así que
todos los usuarios recibían la fecha de **arranque del servidor**.

**Solución:** `default: Date.now` (referencia a la función, Mongoose la invoca por cada
documento). Una sola línea cambiada. Los usuarios ya existentes conservan su valor incorrecto
(no se hizo migración de datos).

---

## Fix 4 — Paginación + N+1

**NUEVO** helper [`src/utils/pagination.util.ts`](../src/utils/pagination.util.ts):
- `get_pagination_params(query, default_limit=20, max_limit=100)` → `{ page, limit, skip }`
  (sanea valores inválidos; `limit` tope 100).
- `build_pagination_meta({ total, page, limit })` → `{ total, page, limit, total_pages, has_next, has_prev }`.

**Convención de query params:** `?page=1&limit=20`.

**Endpoints paginados (BREAKING para el frontend — ver abajo):**
| Endpoint | Service | Controller |
|----------|---------|------------|
| `GET /v1/api/users` | `user.service.get_all_users` | `user.controller.get_all_users` |
| `GET /v1/api/tickets` | `ticket.service.get_all_tickets` | `ticket.controller.get_all_tickets` |
| `GET /v1/api/tickets/my-tickets` | `ticket.service.get_tickets_by_user_id` | `ticket.controller.get_my_tickets` |
| `GET /v1/api/tickets/user/:user_id` | `ticket.service.get_tickets_by_user_id` | `ticket.controller.get_tickets_by_user` |

**Cambio de contrato de los services:** estos métodos ahora devuelven
`{ data: T[], total: number }` (antes devolvían el array directo). Las queries usan
`.skip().limit().sort()` + `countDocuments()` en paralelo (`Promise.all`) y `.lean()`.

**Cambio de contrato de la respuesta HTTP:** además de `data`, ahora incluyen un objeto
`pagination`:
```jsonc
{
  "success": true,
  "message": "...",
  "data": [ /* ... */ ],
  "pagination": { "total": 153, "page": 1, "limit": 20, "total_pages": 8, "has_next": true, "has_prev": false }
}
```
> ⚠️ **Frontend:** si consumías `data` como la lista completa, ahora viene paginada (20 por
> defecto). Hay que iterar páginas o pasar `?limit=`.

**N+1 resueltos:**
- `soccer_game.service.get_all_soccer_games`: antes hacía `TournamentModel.findById` **por cada
  partido** dentro del bucle. Ahora carga **todos los torneos una vez** y los indexa en un `Map`.
- `ticket.service.get_ticket_by_id`: las 3 consultas independientes (curva, juego, cliente) ahora
  corren en paralelo con `Promise.all` en lugar de secuencial.

**No paginado a propósito:** `get_tickets_by_game_id` se dejó sin paginar porque
`mark_losers_winners_users` (evaluación de ganadores al cerrar partido) necesita **todas** las
boletas del juego. Paginarlo rompería la liquidación.

---

## Fix 5 — Escalada de privilegios en el registro

**Problema:** `POST /v1/api/users/register` (público) en
[`src/controllers/user.controller.ts`](../src/controllers/user.controller.ts) pasaba `role`
directo desde `req.body` a `create_new_user`. Cualquiera podía registrarse como `admin`
mandando `{"role":"admin"}`.

**Solución:**
- **MODIFICADO** `create_user` (registro público): ignora `role` del body y **siempre** crea
  `role: 'customer'`.
- **NUEVO** método de controller `create_user_by_admin`: acepta `role` explícito, validado contra
  `['admin','staff','customer']`.
- **NUEVA** ruta `POST /v1/api/users/admin` protegida con `admin_auth` (en `user.routes.ts`).

**Cómo crear staff/admin ahora:** autenticado como admin, `POST /v1/api/users/admin` con
`{ name, email, password, identity, phone, role }`. El email de bienvenida (admin/staff) lo
sigue enviando `user.service.create_new_user` según el rol.

---

## Archivos tocados

**Nuevos**
- `src/auth/role.auth.ts` — middleware `authorize(...roles)`
- `src/utils/pagination.util.ts` — helpers de paginación
- `docs/CAMBIOS-FIXES-CRITICOS.md` — este documento

**Modificados**
- `src/routes/user.routes.ts` — auth combinado, ruta `/admin`, `reset-password` público
- `src/controllers/user.controller.ts` — `create_user` fuerza customer, `create_user_by_admin`, paginación en `get_all_users`
- `src/controllers/ticket.controller.ts` — paginación en `get_all_tickets`, `get_my_tickets`, `get_tickets_by_user`
- `src/models/user.model.ts` — `created_at: Date.now`
- `src/services/user.service.ts` — `get_all_users` paginado (`{ data, total }`)
- `src/services/ticket.service.ts` — compra atómica, paginación, `get_ticket_by_id` en paralelo, import de `SoccerGameModel`
- `src/services/soccer_game.service.ts` — `claim_random_result_atomic`, `mark_curva_sold_out`, N+1 de torneos

**Eliminados:** ninguno.

---

## Verificación

- `tsc --noEmit`: **32 errores**, todos del patrón `string | string[]` (typings de Express 5 sobre
  `req.params`/`req.query`) y **pre-existentes** en toda la base (games/player/teams/etc.). Se
  confirmó por comparación con `git stash`: **mismo conteo (32) con y sin estos cambios** → los
  fixes no introducen errores de tipo nuevos. Los archivos de lógica nuevos/modificados
  (`role.auth`, `pagination.util`, `*.service`, `user.model`) están limpios.
- No hay suite de tests en el proyecto, por lo que no se ejecutaron pruebas automatizadas.

---

## Pendientes / siguientes pasos sugeridos (NO incluidos en esta tanda)

1. **Deuda de tipos Express 5:** los 32 errores `string | string[]`. Arreglar con un helper
   `as string` centralizado o tipando `req.params`/`req.query`. Hace fallar `pnpm build` (`tsc`);
   dev funciona vía ts-node/nodemon (transpile).
2. **Idempotencia del webhook de Wompi:** el ticket se crea y *después* se le setea
   `payment_reference`; un webhook duplicado concurrente podría crear dos. Conviene crear el
   ticket ya con la referencia (upsert por `payment_reference`).
3. **Validar el monto pagado** (`amount_in_cents`) contra `precio × cantidad` antes de emitir boleta.
4. **Recuperación de contraseña insegura:** `recover_code` de 6 dígitos, en texto plano, sin
   expiración. Añadir expiración + un solo uso + rate-limit.
5. **No devolver `password`** en los listados de usuarios (`get_all_users` hace `.lean()` pero aún
   incluye el hash). Añadir `.select('-password')`.
6. **Quitar `console.log` sensibles** en `user.service.login_user`.
7. **Manejador de errores global** de Express para eliminar el `try/catch` repetido en controllers.
