import "../config/firebase.js"; // Inicializa Firebase
import { auth, db } from "../config/firebase.js";
import { UserRole } from "../models/user.model.js";
import type { User } from "../models/user.model.js";

/**
 * Script para crear usuarios de prueba
 * Ejecutar con: npm run create-user
 */

const createTestUser = async () => {
  try {
    console.log("🔧 Creando usuario de prueba...\n");

    // Datos del usuario gerente
    const gerenteData = {
      email: "gerente@carniceria.com",
      password: "gerente123",
      name: "Gerente Principal",
      role: UserRole.GERENTE,
    };

    // Datos del usuario cajero
    const cajeroData = {
      email: "cajero@carniceria.com",
      password: "cajero123",
      name: "Cajero Test",
      role: UserRole.CAJERO,
    };

    // Crear usuarios en Firebase Auth
    console.log("📝 Creando usuarios en Firebase Auth...");

    const gerenteAuth = await auth.createUser({
      email: gerenteData.email,
      password: gerenteData.password,
      displayName: gerenteData.name,
    });

    const cajeroAuth = await auth.createUser({
      email: cajeroData.email,
      password: cajeroData.password,
      displayName: cajeroData.name,
    });

    console.log("✅ Usuarios creados en Firebase Auth");

    // Crear documentos en Firestore
    console.log("📝 Creando documentos en Firestore...");

    const gerenteFirestore: User = {
      uid: gerenteAuth.uid,
      email: gerenteData.email,
      name: gerenteData.name,
      role: gerenteData.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cajeroFirestore: User = {
      uid: cajeroAuth.uid,
      email: cajeroData.email,
      name: cajeroData.name,
      role: cajeroData.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").doc(gerenteAuth.uid).set(gerenteFirestore);
    await db.collection("users").doc(cajeroAuth.uid).set(cajeroFirestore);

    console.log("✅ Documentos creados en Firestore\n");

    console.log("🎉 Usuarios de prueba creados exitosamente!\n");
    console.log("📋 Credenciales:\n");
    console.log("👔 GERENTE:");
    console.log(`   Email: ${gerenteData.email}`);
    console.log(`   Password: ${gerenteData.password}`);
    console.log(`   UID: ${gerenteAuth.uid}\n`);
    console.log("💰 CAJERO:");
    console.log(`   Email: ${cajeroData.email}`);
    console.log(`   Password: ${cajeroData.password}`);
    console.log(`   UID: ${cajeroAuth.uid}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error al crear usuarios:", error.message);
    process.exit(1);
  }
};

createTestUser();
