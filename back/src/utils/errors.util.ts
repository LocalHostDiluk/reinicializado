// Clase base para errores personalizados
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Errores específicos
export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso prohibido") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(404, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Solicitud inválida") {
    super(400, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto con el recurso existente") {
    super(409, message);
  }
}

// Manejador global de errores para Express
export const errorHandler = (err: Error, req: any, res: any, next: any) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Error no manejado
  console.error("❌ Error no manejado:", err);
  return res.status(500).json({
    status: "error",
    message: "Error interno del servidor",
  });
};
