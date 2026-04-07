import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectColumnKey } from '@/contracts/project/project.enums';
import { TaskPriority } from '@/contracts/task/task.enums';

class UpdateSubtaskDto {
  @ApiPropertyOptional({ example: 'subtask-id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Write unit tests' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isDone?: boolean;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Implement login flow (updated)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Add refresh token rotation' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    example: '2026-04-07',
    description: 'Task deadline (ISO 8601 date or datetime)',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: '65f0c0d2e2d3d4f5a6b7c8d9' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.high })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: ProjectColumnKey,
    example: ProjectColumnKey.in_review,
  })
  @IsOptional()
  @IsEnum(ProjectColumnKey)
  columnKey?: ProjectColumnKey;

  @ApiPropertyOptional({ example: ['labelId1', 'labelId2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ type: [UpdateSubtaskDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSubtaskDto)
  subtasks?: UpdateSubtaskDto[];

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999)
  order?: number;
}
