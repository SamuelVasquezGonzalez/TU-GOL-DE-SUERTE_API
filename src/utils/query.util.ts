/**
 * Coacciona un valor de `req.query.X` / `req.params.X` (que en Express 5 puede
 * tiparse como `string | string[]`) a un `string` plano.
 *
 * - Si es un arreglo, toma el primer elemento.
 * - Si es `undefined`/`null`, devuelve el `fallback` (por defecto cadena vacía,
 *   lo que coincide con el comportamiento previo en tiempo de ejecución).
 */
export const as_string = (v: unknown, fallback = ''): string =>
  Array.isArray(v) ? String(v[0] ?? fallback) : v === undefined || v === null ? fallback : String(v)
