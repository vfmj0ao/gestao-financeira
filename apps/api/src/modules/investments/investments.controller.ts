import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  createInvestmentSchema,
  type CreateInvestmentInput,
} from './investments.schemas';
import { InvestmentsService } from './investments.service';

@Controller('groups/:groupId/investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
  ) {
    return this.investmentsService.list(user, groupId);
  }

  @Get('summary')
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
  ) {
    return this.investmentsService.summary(user, groupId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body(new ZodValidationPipe(createInvestmentSchema))
    body: CreateInvestmentInput,
  ) {
    return this.investmentsService.create(user, groupId, body);
  }

  @Patch(':investmentId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('investmentId') investmentId: string,
    @Body(new ZodValidationPipe(createInvestmentSchema))
    body: CreateInvestmentInput,
  ) {
    return this.investmentsService.update(user, groupId, investmentId, body);
  }

  @Delete(':investmentId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('investmentId') investmentId: string,
  ) {
    return this.investmentsService.remove(user, groupId, investmentId);
  }
}
