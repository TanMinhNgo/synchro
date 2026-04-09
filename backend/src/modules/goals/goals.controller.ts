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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserClaims } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateGoalDto } from '@/contracts/goals/dto/create-goal.dto';
import { UpdateGoalDto } from '@/contracts/goals/dto/update-goal.dto';
import { GoalsService } from './goals.service';

@Controller('goals')
@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List goals for current user' })
  @ApiOkResponse({ description: 'Goals list' })
  list(@CurrentUser() user: any) {
    const userId = (user as CurrentUserClaims).sub;
    return this.goals.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a goal for current user' })
  @ApiOkResponse({ description: 'Created goal' })
  create(@CurrentUser() user: any, @Body() dto: CreateGoalDto) {
    const userId = (user as CurrentUserClaims).sub;
    return this.goals.create(userId, dto);
  }

  @Patch(':goalId')
  @ApiOperation({ summary: 'Update a goal (current user only)' })
  @ApiOkResponse({ description: 'Updated goal' })
  update(
    @CurrentUser() user: any,
    @Param('goalId') goalId: string,
    @Body() dto: UpdateGoalDto,
  ) {
    const userId = (user as CurrentUserClaims).sub;
    return this.goals.update(userId, goalId, dto);
  }

  @Delete(':goalId')
  @ApiOperation({ summary: 'Delete a goal (current user only)' })
  @ApiOkResponse({ description: 'Delete status' })
  remove(@CurrentUser() user: any, @Param('goalId') goalId: string) {
    const userId = (user as CurrentUserClaims).sub;
    return this.goals.remove(userId, goalId);
  }
}
