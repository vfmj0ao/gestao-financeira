import { Module } from '@nestjs/common';
import { InvestmentsController } from './investments.controller';
import { InvestmentsRepository } from './investments.repository';
import { InvestmentsService } from './investments.service';

@Module({
  controllers: [InvestmentsController],
  providers: [InvestmentsService, InvestmentsRepository],
})
export class InvestmentsModule {}
