import { Global, Module } from '@nestjs/common';
import { MembershipAccessService } from '../auth/membership-access.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, MembershipAccessService],
  exports: [PrismaService, MembershipAccessService],
})
export class PrismaModule {}
