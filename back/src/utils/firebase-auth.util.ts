import { BadRequestError, UnauthorizedError } from "./errors.util.js";

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

/**
 * Verifica credenciales de usuario usando Firebase Auth REST API
 * Documentación: https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password
 */
export const verifyFirebasePassword = async (
  email: string,
  password: string
): Promise<{ uid: string; email: string }> => {
  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

  if (!FIREBASE_API_KEY) {
    throw new Error(
      "FIREBASE_API_KEY no está configurado en las variables de entorno"
    );
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Manejar errores específicos de Firebase
      if (
        errorData.error?.message === "EMAIL_NOT_FOUND" ||
        errorData.error?.message === "INVALID_PASSWORD" ||
        errorData.error?.message === "INVALID_LOGIN_CREDENTIALS"
      ) {
        throw new UnauthorizedError("Credenciales inválidas");
      }

      if (errorData.error?.message === "USER_DISABLED") {
        throw new UnauthorizedError("Usuario desactivado");
      }

      if (errorData.error?.message === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        throw new BadRequestError(
          "Demasiados intentos fallidos. Intenta más tarde"
        );
      }

      throw new BadRequestError("Error al verificar credenciales");
    }

    const data: FirebaseAuthResponse = await response.json();

    return {
      uid: data.localId,
      email: data.email,
    };
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }

    console.error("Error al verificar contraseña con Firebase:", error);
    throw new BadRequestError("Error al verificar credenciales");
  }
};
