import admin from "firebase-admin";
import { createRequire } from "module";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 2. Tipar explícitamente las exportaciones
export const db: Firestore = admin.firestore();
export const auth: Auth = admin.auth();

console.log("🔥 Firebase Admin conectado exitosamente");
