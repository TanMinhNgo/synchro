import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'TASK_ASSIGNED' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  type!: string;

  @ApiProperty({ example: 'You were assigned a task' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Task: Implement login flow' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @ApiPropertyOptional({ example: '{"taskId":"..."}' })
  @IsOptional()
  data?: Record<string, unknown>;
}
