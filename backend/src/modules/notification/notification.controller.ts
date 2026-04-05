import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserClaims } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from '@/contracts/notification/dto/create-notification.dto';
import { MarkReadDto } from '@/contracts/notification/dto/mark-read.dto';
import { NotificationProxyService } from './notification.proxy.service';

@Controller('notifications')
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notifications: NotificationProxyService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiOkResponse({ description: 'Notifications list' })
  list(@CurrentUser() user: any, @Query('unreadOnly') unreadOnly?: string) {
    const userId = (user as CurrentUserClaims).sub;
    return this.notifications.list(userId, {
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Create a notification for current user (dev/testing)',
  })
  create(@CurrentUser() user: any, @Body() dto: CreateNotificationDto) {
    const userId = (user as CurrentUserClaims).sub;
    return this.notifications.create(userId, dto);
  }

  @Post(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification read/unread' })
  markRead(
    @CurrentUser() user: any,
    @Param('notificationId') notificationId: string,
    @Body() dto: MarkReadDto,
  ) {
    const userId = (user as CurrentUserClaims).sub;
    return this.notifications.markRead(
      userId,
      notificationId,
      dto.read ?? true,
    );
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    const userId = (user as CurrentUserClaims).sub;
    return this.notifications.markAllRead(userId);
  }
}
