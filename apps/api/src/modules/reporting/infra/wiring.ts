import { MongooseIssueReportRepository } from './IssueReportRepository';
import { ReportService } from '../application/report.service';
import { DashboardService } from '../application/dashboard.service';
import { userRepo } from '../../identity';
import { bookRepo } from '../../catalog';
import { orderRepo } from '../../ordering';

export const issueRepo = new MongooseIssueReportRepository();
export const reportService = new ReportService(issueRepo, orderRepo);
export const dashboardService = new DashboardService(userRepo, bookRepo, orderRepo, issueRepo);
