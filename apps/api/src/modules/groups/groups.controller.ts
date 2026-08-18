import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  acceptInviteSchema,
  inviteMemberSchema,
  type AcceptInviteInput,
  type InviteMemberInput,
} from '../auth/auth.schemas';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.listMine(user.id);
  }

  @Get(':groupId/members')
  listMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.listMembers(user, groupId);
  }

  @Post(':groupId/invites')
  createInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body(new ZodValidationPipe(inviteMemberSchema)) body: InviteMemberInput,
  ) {
    return this.groupsService.createInvite(user, groupId, body);
  }
}

@Controller('invites')
export class InvitesController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get(':token')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  preview(@Param('token') token: string) {
    return this.groupsService.getInvitePreview(token);
  }

  @Post('accept')
  @UseGuards(JwtAuthGuard)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(acceptInviteSchema)) body: AcceptInviteInput,
  ) {
    return this.groupsService.acceptInvite(user, body.token);
  }
}
