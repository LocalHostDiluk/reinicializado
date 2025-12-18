import { auth, db } from "../config/firebase.js";
import type {
  User,
  AuthResponse,
  LoginRequest,
  VerifyManagerRequest,
  JWTPayload,
} from "../models/user.model.js";
import { UserRole } from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateManagerToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";
import { UnauthorizedError, NotFoundError } from "../utils/errors.util.js";
import {
  validateEmail,
  validateRequiredFields,
} from "../utils/validation.util.js";
import { verifyFirebasePassword } from "../utils/firebase-auth.util.js";

export class AuthService {
  private usersCollection = db.collection("users");

  /**
   * Login de usuario
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    // Validaciones
    validateRequiredFields(data, ["email", "password"]);
    validateEmail(data.email);

    // 1. Verificar credenciales con Firebase Auth REST API
    const firebaseAuth = await verifyFirebasePassword(
      data.email,
      data.password
    );

    // 2. Obtener datos del usuario desde Firestore
    const userDoc = await this.usersCollection.doc(firebaseAuth.uid).get();

    if (!userDoc.exists) {
      throw new NotFoundError("Usuario no encontrado en la base de datos");
    }

    const userData = userDoc.data() as User;

    // 3. Verificar que el usuario esté activo
    if (!userData.isActive) {
      throw new UnauthorizedError(
        "Usuario desactivado. Contacta al administrador"
      );
    }

    // 4. Generar tokens
    const tokenPayload: Omit<JWTPayload, "type"> = {
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 5. Retornar respuesta
    return {
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh de tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    // 1. Verificar refresh token
    const payload = verifyRefreshToken(refreshToken);

    // 2. Obtener usuario actualizado de Firestore
    const userDoc = await this.usersCollection.doc(payload.uid).get();

    if (!userDoc.exists) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const userData = userDoc.data() as User;

    if (!userData.isActive) {
      throw new UnauthorizedError("Usuario desactivado");
    }

    // 3. Generar nuevos tokens
    const tokenPayload: Omit<JWTPayload, "type"> = {
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Verificar credenciales de gerente y generar token temporal
   */
  async verifyManager(
    data: VerifyManagerRequest
  ): Promise<{ managerToken: string }> {
    // Validaciones
    validateRequiredFields(data, ["email", "password", "operation"]);
    validateEmail(data.email);

    // 1. Verificar credenciales con Firebase Auth REST API
    const firebaseAuth = await verifyFirebasePassword(
      data.email,
      data.password
    );

    // 2. Obtener datos del usuario desde Firestore
    const userDoc = await this.usersCollection.doc(firebaseAuth.uid).get();

    if (!userDoc.exists) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const userData = userDoc.data() as User;

    // 3. Verificar que sea gerente
    if (userData.role !== UserRole.GERENTE) {
      throw new UnauthorizedError(
        "Solo los gerentes pueden autorizar esta operación"
      );
    }

    // 4. Verificar que esté activo
    if (!userData.isActive) {
      throw new UnauthorizedError("Usuario desactivado");
    }

    // 5. Generar token temporal de gerente
    const tokenPayload: Omit<JWTPayload, "type"> = {
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
    };

    const managerToken = generateManagerToken(tokenPayload, data.operation);

    return { managerToken };
  }

  /**
   * Obtener perfil del usuario
   */
  async getProfile(uid: string): Promise<User> {
    const userDoc = await this.usersCollection.doc(uid).get();

    if (!userDoc.exists) {
      throw new NotFoundError("Usuario no encontrado");
    }

    return userDoc.data() as User;
  }
}
