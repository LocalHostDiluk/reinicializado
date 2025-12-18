import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./utils/errors.util.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import inventoryBatchRoutes from "./routes/inventory-batch.routes.js";
import inventoryAdjustmentRoutes from "./routes/inventory-adjustment.routes.js";
import saleRoutes from "./routes/sale.routes.js";

const app = express();

// Middlewares de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Butcher Backend is running! 🥩" });
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/inventory/batches", inventoryBatchRoutes);
app.use("/api/inventory/adjustments", inventoryAdjustmentRoutes);
app.use("/api/sales", saleRoutes);

// Manejador de rutas no encontradas (debe ir antes del errorHandler)
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Ruta no encontrada",
  });
});

// Manejador global de errores (debe ir al final)
app.use(errorHandler);

export default app;
