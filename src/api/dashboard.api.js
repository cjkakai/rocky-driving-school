import request from "./client";

export const dashboardAPI = {
  /**
   * Get daily summary stats (students registered, revenue, etc.)
   * Automatically scoped by user role and branch
   */
  getSummaryStats: async () => {
    return request("/api/dashboard/summary-stats/");
  },

  /**
   * Get recent activity feed (registrations, payments, bookings, exams)
   * Automatically scoped by user role and branch
   */
  getActivityFeed: async (limit = 15) => {
    return request(`/api/dashboard/activity-feed/?limit=${limit}`);
  },

  /**
   * Get branch performance data (admin/supervisor only)
   * Returns per-branch metrics: student count, revenue, growth %
   */
  getBranchPerformance: async () => {
    return request("/api/dashboard/branch-performance/");
  },

  /**
   * Get revenue trend data (monthly aggregation)
   * Returns last 6-12 months of revenue
   */
  getRevenueTrend: async (months = 6) => {
    return request(`/api/dashboard/revenue-trend/?months=${months}`);
  },

  /**
   * Get daily revenue for the current month, branch-scoped
   */
  getCurrentMonthDailyRevenue: async () => {
    return request("/api/dashboard/daily-revenue-trend/");
  },
};
