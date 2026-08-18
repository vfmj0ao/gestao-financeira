import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { reportQuerySchema, type ReportQuery } from './reports.schemas';
import { ReportsService } from './reports.service';

@Controller('groups/:groupId')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('reports')
  getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery,
  ) {
    const months = Number(query.months ?? '12') as 6 | 12 | 24;
    return this.reportsService.getReport(user, groupId, months);
  }
}
