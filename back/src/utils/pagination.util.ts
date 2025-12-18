export interface PaginationParams {
  page?: number; // Número de página (default: 1)
  limit?: number; // Items por página (default: 10)
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Calcula la metadata de paginación
 */
export const calculatePagination = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Valida y normaliza parámetros de paginación
 */
export const normalizePagination = (params: PaginationParams) => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));

  return { page, limit };
};
