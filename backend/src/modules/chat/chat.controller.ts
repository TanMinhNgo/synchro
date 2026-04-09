import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserClaims } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('token')
  @ApiOperation({ summary: 'Get Stream Chat token for current user' })
  @ApiOkResponse({ description: 'Token payload for Stream client' })
  async token(@CurrentUser() user: CurrentUserClaims) {
    return this.chat.getTokenForUser(user.sub, user.email);
  }

  @Get('video-token')
  @ApiOperation({ summary: 'Get Stream Video token for current user' })
  @ApiOkResponse({ description: 'Token payload for Stream Video client' })
  async videoToken(
    @CurrentUser() user: CurrentUserClaims,
    @Query('callId') callId?: string,
  ) {
    return this.chat.getVideoTokenForUser(user.sub, user.email, callId);
  }
}
