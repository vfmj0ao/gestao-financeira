import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { currentUtcMonth } from '../transactions/money';
import {
  copyBudgetsSchema,
  monthQuerySchema,
  upsertBudgetsSchema,
  type CopyBudgetsInput,
  type MonthQuery,
  type UpsertBudgetsInput,
} from './budgets.schemas';
import { BudgetsService } from './budgets.service';

@Controller('groups/:groupId/budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(monthQuerySchema)) query: MonthQuery,
  ) {
    return this.budgetsService.list(
      user,
      groupId,
      query.month ?? currentUtcMonth(),
    );
  }

  @Put()
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body(new ZodValidationPipe(upsertBudgetsSchema)) body: UpsertBudgetsInput,
  ) {
    return this.budgetsService.upsert(user, groupId, body);
  }

  @Post('copy')
  copy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body(new ZodValidationPipe(copyBudgetsSchema)) body: CopyBudgetsInput,
  ) {
    return this.budgetsService.copy(user, groupId, body);
  }
}
