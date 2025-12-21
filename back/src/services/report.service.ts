import { db } from "../config/firebase.js";
import type {
  DashboardMetrics,
  SalesByPeriodReport,
  SalesComparisonReport,
  TopSellingProduct,
  SalesByPaymentMethodReport,
  SalesByUserReport,
  InventoryValueReport,
  LowStockProduct,
  ExpiringProduct,
  SlowMovingProduct,
  ProductProfitReport,
  ProfitByPeriodReport,
  WasteSummaryReport,
  ReportDateFilter,
  TopProductsFilter,
  SlowMovingFilter,
  ExpiringFilter,
} from "../models/report.model.js";
import type { Sale } from "../models/sale.model.js";
import type { Purchase } from "../models/purchase.model.js";
import type { InventoryBatch } from "../models/inventory-batch.model.js";
import type { Product } from "../models/product.model.js";
import type { InventoryAdjustment } from "../models/inventory-adjustment.model.js";
import { PaymentMethod } from "../models/sale.model.js";
import { PurchaseStatus } from "../models/purchase.model.js";
import { AdjustmentType } from "../models/inventory-adjustment.model.js";

export class ReportService {
  private salesCollection = db.collection("sales");
  private purchasesCollection = db.collection("purchases");
  private batchesCollection = db.collection("inventory_batches");
  private productsCollection = db.collection("products");
  private adjustmentsCollection = db.collection("inventory_adjustments");
  private categoriesCollection = db.collection("categories");

  /**
   * Dashboard General - Métricas clave
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ventas
    const allSales = await this.salesCollection.get();
    const sales = allSales.docs.map((doc) => doc.data() as Sale);

    const salesToday = sales.filter(
      (s) => (s.created_at as any).toDate() >= todayStart
    );
    const salesThisWeek = sales.filter(
      (s) => (s.created_at as any).toDate() >= weekStart
    );
    const salesThisMonth = sales.filter(
      (s) => (s.created_at as any).toDate() >= monthStart
    );

    // Compras
    const allPurchases = await this.purchasesCollection.get();
    const purchases = allPurchases.docs.map((doc) => doc.data() as Purchase);
    const pendingPurchases = purchases.filter(
      (p) => p.status === PurchaseStatus.PENDING
    );
    const purchasesThisMonth = purchases.filter(
      (p) => (p.created_at as any).toDate() >= monthStart
    );

    // Inventario
    const allBatches = await this.batchesCollection
      .where("current_quantity", ">", 0)
      .get();
    const batches = allBatches.docs.map((doc) => doc.data() as InventoryBatch);
    const totalInventoryValue = batches.reduce(
      (sum, b) => sum + b.current_quantity * b.purchase_price,
      0
    );

    const allProducts = await this.productsCollection
      .where("is_active", "==", true)
      .get();
    const products = allProducts.docs.map((doc) => doc.data() as Product);

    // Calcular stock por producto
    const productStockMap = new Map<string, number>();
    batches.forEach((batch) => {
      const current = productStockMap.get(batch.product_id) || 0;
      productStockMap.set(batch.product_id, current + batch.current_quantity);
    });

    const lowStockCount = products.filter((p) => {
      const stock = productStockMap.get(p.id) || 0;
      return stock < (p.min_sale_quantity || 1);
    }).length;

    const expiringSoonCount = batches.filter((b) => {
      if (!b.expiration_date) return false;
      const expDate = (b.expiration_date as any).toDate();
      const daysUntil = Math.ceil(
        (expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil <= 7 && daysUntil > 0;
    }).length;

    // Mermas
    const allAdjustments = await this.adjustmentsCollection.get();
    const adjustments = allAdjustments.docs.map(
      (doc) => doc.data() as InventoryAdjustment
    );

    const wasteThisWeek = adjustments
      .filter(
        (a) =>
          (a.adjustment_type === AdjustmentType.WASTE_EXPIRED ||
            a.adjustment_type === AdjustmentType.WASTE_DAMAGED) &&
          (a.created_at as any).toDate() >= weekStart
      )
      .reduce((sum, a) => sum + Math.abs(a.quantity), 0);

    const wasteThisMonth = adjustments
      .filter(
        (a) =>
          (a.adjustment_type === AdjustmentType.WASTE_EXPIRED ||
            a.adjustment_type === AdjustmentType.WASTE_DAMAGED) &&
          (a.created_at as any).toDate() >= monthStart
      )
      .reduce((sum, a) => sum + Math.abs(a.quantity), 0);

    const wasteTotal = adjustments
      .filter(
        (a) =>
          a.adjustment_type === AdjustmentType.WASTE_EXPIRED ||
          a.adjustment_type === AdjustmentType.WASTE_DAMAGED
      )
      .reduce((sum, a) => sum + Math.abs(a.quantity), 0);

    return {
      sales: {
        today: salesToday.reduce((sum, s) => sum + s.total, 0),
        this_week: salesThisWeek.reduce((sum, s) => sum + s.total, 0),
        this_month: salesThisMonth.reduce((sum, s) => sum + s.total, 0),
        total: sales.reduce((sum, s) => sum + s.total, 0),
      },
      purchases: {
        pending: pendingPurchases.length,
        this_month: purchasesThisMonth.reduce((sum, p) => sum + p.total, 0),
        total: purchases.reduce((sum, p) => sum + p.total, 0),
      },
      inventory: {
        total_value: totalInventoryValue,
        total_products: products.length,
        low_stock_count: lowStockCount,
        expiring_soon_count: expiringSoonCount,
      },
      waste: {
        this_week: wasteThisWeek,
        this_month: wasteThisMonth,
        total: wasteTotal,
      },
    };
  }

  /**
   * Ventas por período
   */
  async getSalesByPeriod(
    filters: ReportDateFilter = {}
  ): Promise<SalesByPeriodReport[]> {
    let query: FirebaseFirestore.Query = this.salesCollection;
    query = query.orderBy("created_at", "asc");

    const snapshot = await query.get();
    let sales = snapshot.docs.map((doc) => doc.data() as Sale);

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      sales = sales.filter((sale) => {
        const saleDate = (sale.created_at as any).toDate();
        if (startDate && saleDate < startDate) return false;
        if (endDate && saleDate > endDate) return false;
        return true;
      });
    }

    // Agrupar por día
    const salesByDay = new Map<string, { sales: Sale[] }>();

    sales.forEach((sale) => {
      const date = (sale.created_at as any).toDate();
      const dayKey = date.toISOString().split("T")[0];

      if (!salesByDay.has(dayKey)) {
        salesByDay.set(dayKey, { sales: [] });
      }

      salesByDay.get(dayKey)!.sales.push(sale);
    });

    // Generar reporte
    const report: SalesByPeriodReport[] = [];

    salesByDay.forEach((data, period) => {
      const totalSales = data.sales.length;
      const totalAmount = data.sales.reduce((sum, s) => sum + s.total, 0);
      const totalItems = data.sales.reduce((sum, s) => {
        return (
          sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
        );
      }, 0);

      report.push({
        period,
        total_sales: totalSales,
        total_amount: totalAmount,
        total_items_sold: totalItems,
        average_ticket: totalSales > 0 ? totalAmount / totalSales : 0,
      });
    });

    return report.sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Comparativa de ventas entre dos períodos
   */
  async getSalesComparison(
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string
  ): Promise<SalesComparisonReport> {
    const allSales = await this.salesCollection.get();
    const sales = allSales.docs.map((doc) => doc.data() as Sale);

    const currentStartDate = new Date(currentStart);
    const currentEndDate = new Date(currentEnd);
    const previousStartDate = new Date(previousStart);
    const previousEndDate = new Date(previousEnd);

    const currentSales = sales.filter((s) => {
      const date = (s.created_at as any).toDate();
      return date >= currentStartDate && date <= currentEndDate;
    });

    const previousSales = sales.filter((s) => {
      const date = (s.created_at as any).toDate();
      return date >= previousStartDate && date <= previousEndDate;
    });

    const currentAmount = currentSales.reduce((sum, s) => sum + s.total, 0);
    const previousAmount = previousSales.reduce((sum, s) => sum + s.total, 0);

    const salesGrowth =
      previousSales.length > 0
        ? ((currentSales.length - previousSales.length) /
            previousSales.length) *
          100
        : 0;

    const amountGrowth =
      previousAmount > 0
        ? ((currentAmount - previousAmount) / previousAmount) * 100
        : 0;

    return {
      current_period: {
        start_date: currentStart,
        end_date: currentEnd,
        total_sales: currentSales.length,
        total_amount: currentAmount,
      },
      previous_period: {
        start_date: previousStart,
        end_date: previousEnd,
        total_sales: previousSales.length,
        total_amount: previousAmount,
      },
      comparison: {
        sales_growth_percentage: salesGrowth,
        amount_growth_percentage: amountGrowth,
      },
    };
  }

  /**
   * Top productos más vendidos
   */
  async getTopSellingProducts(
    filters: TopProductsFilter = {}
  ): Promise<TopSellingProduct[]> {
    const limit = filters.limit || 10;

    let query: FirebaseFirestore.Query = this.salesCollection;
    const snapshot = await query.get();
    let sales = snapshot.docs.map((doc) => doc.data() as Sale);

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      sales = sales.filter((sale) => {
        const saleDate = (sale.created_at as any).toDate();
        if (startDate && saleDate < startDate) return false;
        if (endDate && saleDate > endDate) return false;
        return true;
      });
    }

    // Agrupar por producto
    const productMap = new Map<
      string,
      {
        name: string;
        quantity: number;
        amount: number;
        count: number;
      }
    >();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productMap.has(item.product_id)) {
          productMap.set(item.product_id, {
            name: item.product_name,
            quantity: 0,
            amount: 0,
            count: 0,
          });
        }

        const current = productMap.get(item.product_id)!;
        current.quantity += item.quantity;
        current.amount += item.subtotal;
        current.count++;
      });
    });

    // Convertir a array y ordenar
    const topProducts: TopSellingProduct[] = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        product_id: productId,
        product_name: data.name,
        total_quantity_sold: data.quantity,
        total_amount: data.amount,
        sales_count: data.count,
      }))
      .sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
      .slice(0, limit);

    return topProducts;
  }

  /**
   * Ventas por método de pago
   */
  async getSalesByPaymentMethod(
    filters: ReportDateFilter = {}
  ): Promise<SalesByPaymentMethodReport[]> {
    let query: FirebaseFirestore.Query = this.salesCollection;
    const snapshot = await query.get();
    let sales = snapshot.docs.map((doc) => doc.data() as Sale);

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      sales = sales.filter((sale) => {
        const saleDate = (sale.created_at as any).toDate();
        if (startDate && saleDate < startDate) return false;
        if (endDate && saleDate > endDate) return false;
        return true;
      });
    }

    const totalAmount = sales.reduce((sum, s) => sum + s.total, 0);

    // Agrupar por método de pago
    const paymentMap = new Map<
      PaymentMethod,
      { count: number; amount: number }
    >();

    Object.values(PaymentMethod).forEach((method) => {
      paymentMap.set(method, { count: 0, amount: 0 });
    });

    sales.forEach((sale) => {
      const current = paymentMap.get(sale.payment_method)!;
      current.count++;
      current.amount += sale.total;
    });

    const report: SalesByPaymentMethodReport[] = [];
    paymentMap.forEach((data, method) => {
      report.push({
        payment_method: method,
        total_sales: data.count,
        total_amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      });
    });

    return report.sort((a, b) => b.total_amount - a.total_amount);
  }

  /**
   * Productos con bajo stock
   */
  async getLowStockProducts(): Promise<LowStockProduct[]> {
    const productsSnapshot = await this.productsCollection
      .where("is_active", "==", true)
      .get();
    const products = productsSnapshot.docs.map((doc) => doc.data() as Product);

    const batchesSnapshot = await this.batchesCollection
      .where("current_quantity", ">", 0)
      .get();
    const batches = batchesSnapshot.docs.map(
      (doc) => doc.data() as InventoryBatch
    );

    // Calcular stock por producto
    const productStockMap = new Map<string, number>();
    batches.forEach((batch) => {
      const current = productStockMap.get(batch.product_id) || 0;
      productStockMap.set(batch.product_id, current + batch.current_quantity);
    });

    const lowStockProducts: LowStockProduct[] = [];

    products.forEach((product) => {
      const currentStock = productStockMap.get(product.id) || 0;
      const minQuantity = product.min_sale_quantity || 1;

      if (currentStock < minQuantity) {
        lowStockProducts.push({
          product_id: product.id,
          product_name: product.name,
          current_stock: currentStock,
          min_sale_quantity: minQuantity,
          status: currentStock === 0 ? "critical" : "warning",
        });
      }
    });

    return lowStockProducts.sort((a, b) => a.current_stock - b.current_stock);
  }

  /**
   * Productos próximos a caducar
   */
  async getExpiringProducts(
    filters: ExpiringFilter = {}
  ): Promise<ExpiringProduct[]> {
    const days = filters.days || 7;
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const batchesSnapshot = await this.batchesCollection
      .where("current_quantity", ">", 0)
      .get();
    const batches = batchesSnapshot.docs.map(
      (doc) => doc.data() as InventoryBatch
    );

    // Obtener nombres de productos
    const productIds = [...new Set(batches.map((b) => b.product_id))];
    const productsMap = new Map<string, string>();

    for (const productId of productIds) {
      const productDoc = await this.productsCollection.doc(productId).get();
      if (productDoc.exists) {
        const product = productDoc.data();
        productsMap.set(productId, product?.name || "Desconocido");
      }
    }

    const expiringProducts: ExpiringProduct[] = [];

    batches.forEach((batch) => {
      if (!batch.expiration_date) return;

      const expDate = (batch.expiration_date as any).toDate();
      const daysUntil = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= days) {
        let status: "expired" | "critical" | "warning";
        if (daysUntil < 0) status = "expired";
        else if (daysUntil <= 3) status = "critical";
        else status = "warning";

        expiringProducts.push({
          batch_id: batch.id,
          product_id: batch.product_id,
          product_name: productsMap.get(batch.product_id) || "Desconocido",
          current_quantity: batch.current_quantity,
          expiration_date: expDate,
          days_until_expiration: daysUntil,
          status,
        });
      }
    });

    return expiringProducts.sort(
      (a, b) => a.days_until_expiration - b.days_until_expiration
    );
  }

  /**
   * Productos que no rotan (sin ventas en X días)
   */
  async getSlowMovingProducts(
    filters: SlowMovingFilter = {}
  ): Promise<SlowMovingProduct[]> {
    const daysWithoutSales = filters.days_without_sales || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysWithoutSales);

    const productsSnapshot = await this.productsCollection
      .where("is_active", "==", true)
      .get();
    const products = productsSnapshot.docs.map((doc) => doc.data() as Product);

    const salesSnapshot = await this.salesCollection.get();
    const sales = salesSnapshot.docs.map((doc) => doc.data() as Sale);

    const batchesSnapshot = await this.batchesCollection
      .where("current_quantity", ">", 0)
      .get();
    const batches = batchesSnapshot.docs.map(
      (doc) => doc.data() as InventoryBatch
    );

    // Calcular stock por producto
    const productStockMap = new Map<string, number>();
    batches.forEach((batch) => {
      const current = productStockMap.get(batch.product_id) || 0;
      productStockMap.set(batch.product_id, current + batch.current_quantity);
    });

    // Calcular última venta por producto
    const lastSaleMap = new Map<string, Date>();

    sales.forEach((sale) => {
      const saleDate = (sale.created_at as any).toDate();
      sale.items.forEach((item) => {
        const currentLastSale = lastSaleMap.get(item.product_id);
        if (!currentLastSale || saleDate > currentLastSale) {
          lastSaleMap.set(item.product_id, saleDate);
        }
      });
    });

    const slowMovingProducts: SlowMovingProduct[] = [];

    products.forEach((product) => {
      const currentStock = productStockMap.get(product.id) || 0;
      if (currentStock === 0) return;

      const lastSale = lastSaleMap.get(product.id);

      if (!lastSale || lastSale < cutoffDate) {
        const daysSince = lastSale
          ? Math.ceil((Date.now() - lastSale.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const slowProduct: any = {
          product_id: product.id,
          product_name: product.name,
          current_stock: currentStock,
          days_since_last_sale: daysSince,
        };

        if (lastSale) {
          slowProduct.last_sale_date = lastSale;
        }

        slowMovingProducts.push(slowProduct as SlowMovingProduct);
      }
    });

    return slowMovingProducts.sort(
      (a, b) => b.days_since_last_sale - a.days_since_last_sale
    );
  }

  /**
   * Resumen de mermas
   */
  async getWasteSummary(
    filters: ReportDateFilter = {}
  ): Promise<WasteSummaryReport> {
    let query: FirebaseFirestore.Query = this.adjustmentsCollection;
    const snapshot = await query.get();
    let adjustments = snapshot.docs.map(
      (doc) => doc.data() as InventoryAdjustment
    );

    // Solo mermas
    adjustments = adjustments.filter(
      (a) =>
        a.adjustment_type === AdjustmentType.WASTE_EXPIRED ||
        a.adjustment_type === AdjustmentType.WASTE_DAMAGED
    );

    // Filtrar por fechas
    if (filters.start_date || filters.end_date) {
      const startDate = filters.start_date
        ? new Date(filters.start_date)
        : null;
      const endDate = filters.end_date ? new Date(filters.end_date) : null;

      adjustments = adjustments.filter((adj) => {
        const adjDate = (adj.created_at as any).toDate();
        if (startDate && adjDate < startDate) return false;
        if (endDate && adjDate > endDate) return false;
        return true;
      });
    }

    // Obtener información de productos y lotes para calcular valores
    const batchesSnapshot = await this.batchesCollection.get();
    const batches = batchesSnapshot.docs.map(
      (doc) => doc.data() as InventoryBatch
    );
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    const productsSnapshot = await this.productsCollection.get();
    const products = productsSnapshot.docs.map((doc) => doc.data() as Product);
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalWasteValue = 0;

    // Por tipo
    const byType = new Map<
      AdjustmentType,
      {
        count: number;
        total_quantity: number;
        total_value: number;
      }
    >();

    [AdjustmentType.WASTE_EXPIRED, AdjustmentType.WASTE_DAMAGED].forEach(
      (type) => {
        byType.set(type, { count: 0, total_quantity: 0, total_value: 0 });
      }
    );

    // Por producto
    const byProduct = new Map<
      string,
      {
        name: string;
        total_quantity: number;
        total_value: number;
      }
    >();

    adjustments.forEach((adj) => {
      const batch = batchMap.get(adj.batch_id);
      const value = batch ? Math.abs(adj.quantity) * batch.purchase_price : 0;
      totalWasteValue += value;

      // Por tipo
      const typeData = byType.get(adj.adjustment_type)!;
      typeData.count++;
      typeData.total_quantity += Math.abs(adj.quantity);
      typeData.total_value += value;

      // Por producto
      const product = productMap.get(adj.product_id);
      const productName = product?.name || "Desconocido";

      if (!byProduct.has(adj.product_id)) {
        byProduct.set(adj.product_id, {
          name: productName,
          total_quantity: 0,
          total_value: 0,
        });
      }

      const productData = byProduct.get(adj.product_id)!;
      productData.total_quantity += Math.abs(adj.quantity);
      productData.total_value += value;
    });

    return {
      total_waste: adjustments.reduce(
        (sum, a) => sum + Math.abs(a.quantity),
        0
      ),
      total_waste_value: totalWasteValue,
      by_type: Array.from(byType.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        total_quantity: data.total_quantity,
        total_value: data.total_value,
      })),
      by_product: Array.from(byProduct.entries())
        .map(([productId, data]) => ({
          product_id: productId,
          product_name: data.name,
          total_quantity: data.total_quantity,
          total_value: data.total_value,
        }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, 10), // Top 10 productos con más mermas
    };
  }
}
