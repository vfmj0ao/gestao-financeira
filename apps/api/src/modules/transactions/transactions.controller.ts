import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  createCategorySchema,
  createTransactionSchema,
  monthQuerySchema,
  type CreateCategoryInput,
  type CreateTransactionInput,
  type MonthQuery,
} from './transactions.schemas';
import { TransactionsService } from './transactions.service';

@Controller('groups/:groupId')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('categories')
  listCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
  ) {
    return this.transactionsService.listCategories(user, groupId);
  }

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(monthQuerySchema)) query: MonthQuery,
  ) {
    return this.transactionsService.summary(
      user,
      groupId,
      query.month ?? currentMonth(),
    );
  }

  @Get('transactions')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(monthQuerySchema)) query: MonthQuery,
  ) {
    return this.transactionsService.list(
      user,
      groupId,
      query.month ?? currentMonth(),
    );
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body(new ZodValidationPipe(createCategorySchema))
    body: CreateCategoryInput,
  ) {
    return this.transactionsService.createCategory(user, groupId, body);
  }

  @Post('transactions')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionInput,
  ) {
    return this.transactionsService.create(user, groupId, body);
  }

  @Patch('transactions/:transactionId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('transactionId') transactionId: string,
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionInput,
  ) {
    return this.transactionsService.update(user, groupId, transactionId, body);
  }

  @Delete('transactions/:transactionId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.transactionsService.remove(user, groupId, transactionId);
  }
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}
