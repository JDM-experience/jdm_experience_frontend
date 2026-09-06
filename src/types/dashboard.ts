export interface DashboardSales {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
}

export interface DashboardRevenue {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
}

export interface TourPerformance {
  tourId: number;
  tourName: string;
  bookings: number;
  participants: number;
  confirmedBookings: number;
  cancelledBookings: number;
  revenue: number;
}

export interface SalesTrendPoint {
  date: string;
  bookings: number;
  revenue: number;
}

export interface DashboardSummary {
  sales: DashboardSales;
  revenue: DashboardRevenue;
  tourPerformance: TourPerformance[];
  salesTrend: SalesTrendPoint[];
}

export interface DashboardFilter {
  from?: string;
  to?: string;
}
