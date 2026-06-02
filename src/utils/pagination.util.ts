/**
 * Utilidades de paginación reutilizables para endpoints de listado.
 *
 * Convención de query params:
 *   ?page=1&limit=20
 *
 * - `page`  arranca en 1 (valores inválidos -> 1)
 * - `limit` por defecto 20, con un tope máximo para proteger la base de datos
 */

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export const get_pagination_params = (
  query: any,
  default_limit = 20,
  max_limit = 100
): PaginationParams => {
  let page = parseInt(query?.page, 10)
  let limit = parseInt(query?.limit, 10)

  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1) limit = default_limit
  if (limit > max_limit) limit = max_limit

  return { page, limit, skip: (page - 1) * limit }
}

export const build_pagination_meta = ({
  total,
  page,
  limit,
}: {
  total: number
  page: number
  limit: number
}): PaginationMeta => {
  const total_pages = limit > 0 ? Math.ceil(total / limit) : 0
  return {
    total,
    page,
    limit,
    total_pages,
    has_next: page * limit < total,
    has_prev: page > 1,
  }
}
