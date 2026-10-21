import type { IUserRepository } from '@modules/identity';
import type { IBookRepository } from '@modules/catalog';
import type { IOrderRepository } from '@modules/ordering';
import type { IIssueReportRepository } from '@modules/reporting/domain/report.repository';
import type { Order } from '@modules/ordering';
import type { Book } from '@modules/catalog';

export class DashboardService {
  constructor(
    private readonly users: IUserRepository,
    private readonly books: IBookRepository,
    private readonly orders: IOrderRepository,
    private readonly issues: IIssueReportRepository,
  ) {}

  async summary(lowStockThreshold = 5) {
    const [users, books, orders, openIssues, lowStock, revenueAgg] = await Promise.all([
      this.users.count(),
      this.books.count(),
      this.orders.count(),
      this.issues.countOpen(),
      this.books.countLowStock(lowStockThreshold),
      this.orders.aggregateRevenue({
        deletedAt: null,
        'payment.status': 'paid',
        status: { $in: ['paid', 'processing', 'shipped', 'completed'] },
      }),
    ]);

    return {
      users,
      books,
      orders,
      revenue: revenueAgg.totalRevenue ?? 0,
      openIssueReports: openIssues,
      lowStock,
    };
  }

  async recentOrders(limit = 10): Promise<Order[]> {
    return this.orders.list({ limit: Math.min(50, Math.max(1, limit)) });
  }

  async lowStock(threshold = 5, limit = 50): Promise<Book[]> {
    return this.books.findLowStock(threshold, limit);
  }
}
