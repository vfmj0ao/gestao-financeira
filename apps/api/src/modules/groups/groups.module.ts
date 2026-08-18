import { Module } from '@nestjs/common';
import { GroupsController, InvitesController } from './groups.controller';
import { GroupsRepository } from './groups.repository';
import { GroupsService } from './groups.service';

@Module({
  controllers: [GroupsController, InvitesController],
  providers: [GroupsService, GroupsRepository],
  exports: [GroupsService],
})
export class GroupsModule {}
