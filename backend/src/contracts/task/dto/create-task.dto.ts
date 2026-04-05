import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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

class CreateSubtaskDto {
  @ApiProperty({ example: 'Write unit tests' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isDone?: boolean;
}

export class CreateTaskDto {
  @ApiProperty({ example: '65f0c0d2e2d3d4f5a6b7c8d9' })
  @IsString()
  boardId!: string;

  @ApiProperty({ enum: ProjectColumnKey, example: ProjectColumnKey.backlog })
  @IsEnum(ProjectColumnKey)
  columnKey!: ProjectColumnKey;

  @ApiProperty({ example: 'Implement login flow' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Support email/password + Google OAuth' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: '65f0c0d2e2d3d4f5a6b7c8d9' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.medium })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiPropertyOptional({ example: ['labelId1', 'labelId2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ type: [CreateSubtaskDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubtaskDto)
  subtasks?: CreateSubtaskDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999)
  order?: number;
}
