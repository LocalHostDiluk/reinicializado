import type { PaymentMethod } from "./sale.model.js";
import type { AdjustmentType } from "./inventory-adjustment.model.js";

// ========================================
// DASHBOARD GENERAL
// ========================================

export interface DashboardMetrics {
  sales: {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
  };
  purchases: {
    pending: number;
    this_month: number;
    total: number;
  };
  inventory: {
    total_value: number;
    total_products: number;
    low_stock_count: number;
    expiring_soon_count: number;
  };
  waste: {
    this_week: number;
    this_month: number;
    total: number;
  };
}

// ========================================
// REPORTES DE VENTAS
// ========================================

export interface SalesByPeriodReport {
  period: string; // "2024-12-21", "2024-W51", "2024-12"
  total_sales: number;
  total_amount: number;
  total_items_sold: number;
  average_ticket: number;
}

export interface SalesComparisonReport {
  current_period: {
    start_date: string;
    end_date: string;
    total_sales: number;
    total_amount: number;
  };
  previous_period: {
    start_date: string;
    end_date: string;
    total_sales: number;
    total_amount: number;
  };
  comparison: {
    sales_growth_percentage: number;
    amount_growth_percentage: number;
  };
}

export interface TopSellingProduct {
  product_id: string;
  product_name: string;
  total_quantity_sold: number;
  total_amount: number;
  sales_count: number;
}

export interface SalesByPaymentMethodReport {
  payment_method: PaymentMethod;
  total_sales: number;
  total_amount: number;
  percentage: number;
}

export interface SalesByUserReport {
  user_id: string;
  user_name: string;
  total_sales: number;
  total_amount: number;
  average_ticket: number;
}

// ========================================
// REPORTES DE INVENTARIO
// ========================================

export interface InventoryValueReport {
  total_value: number;
  total_products: number;
  total_batches: number;
  by_category: {
    category_id: string;
    category_name: string;
    total_value: number;
    product_count: number;
  }[];
}

export interface LowStockProduct {
  product_id: string;
  product_name: string;
  current_stock: number;
  min_sale_quantity: number;
  status: "critical" | "warning"; // critical = 0, warning < min
}

export interface ExpiringProduct {
  batch_id: string;
  product_id: string;
  product_name: string;
  current_quantity: number;
  expiration_date: Date;
  days_until_expiration: number;
  status: "expired" | "critical" | "warning";
}

export interface SlowMovingProduct {
  product_id: string;
  product_name: string;
  current_stock: number;
  days_since_last_sale: number;
  last_sale_date?: Date;
}

// ========================================
// REPORTES DE RENTABILIDAD
// ========================================

export interface ProductProfitReport {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
}

export interface ProfitByPeriodReport {
  period: string;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin_percentage: number;
}

// ========================================
// REPORTES DE MERMAS
// ========================================

export interface WasteSummaryReport {
  total_waste: number;
  total_waste_value: number;
  by_type: {
    type: AdjustmentType;
    count: number;
    total_quantity: number;
    total_value: number;
  }[];
  by_product: {
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_value: number;
  }[];
}

// ========================================
// FILTROS
// ========================================

export interface ReportDateFilter {
  start_date?: string;
  end_date?: string;
}

export interface TopProductsFilter extends ReportDateFilter {
  limit?: number; // Default: 10
}

export interface SlowMovingFilter {
  days_without_sales?: number; // Default: 30
}

export interface ExpiringFilter {
  days?: number; // Default: 7
}
