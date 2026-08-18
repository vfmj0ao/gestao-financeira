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
import {
  createGroupSchema,
  updateMemberRoleSchema,
  type CreateGroupInput,
  type UpdateMemberRoleInput,
} from './groups.schemas';
import { GroupsService } from './groups.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.groupsService.listMine(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createGroupSchema)) body: CreateGroupInput,
  ) {
    return this.groupsService.createGroup(user, body);
  }

  @Get(':groupId/members')
  listMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.listMembers(user, groupId);
  }

  @Patch(':groupId/members/:memberUserId')
  updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('memberUserId') memberUserId: string,
    @Body(new ZodValidationPipe(updateMemberRoleSchema))
    body: UpdateMemberRoleInput,
  ) {
    return this.groupsService.updateMemberRole(
      user,
      groupId,
      memberUserId,
      body,
    );
  }

  @Delete(':groupId/members/:memberUserId')
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.groupsService.removeMember(user, groupId, memberUserId);
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
