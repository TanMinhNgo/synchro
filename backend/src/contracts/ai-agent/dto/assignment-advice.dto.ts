import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
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

class CandidateAssigneeDto {
  @ApiProperty({ example: '65f0c0d2e2d3d4f5a6b7c8d9' })
  @IsString()
  @MinLength(1)
  userId!: string;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({
    example: ['auth', 'nestjs', 'testing'],
    description: 'Skill tags used for matching',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillTags?: string[];

  @ApiPropertyOptional({ example: 18, description: 'Current weekly load in hours' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  currentLoadHours?: number;

  @ApiPropertyOptional({ example: 35, description: 'Weekly capacity in hours' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  availableHoursPerWeek?: number;
}

export class AssignmentAdviceDto {
  @ApiProperty({ example: 'Implement report consistency validator' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  taskTitle!: string;

  @ApiPropertyOptional({ example: 'Need robust validation and notification flow.' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  taskDescription?: string;

  @ApiProperty({ example: 12, description: 'Estimated effort in hours' })
  @IsInt()
  @Min(1)
  @Max(400)
  estimatedHours!: number;

  @ApiPropertyOptional({ example: ['nestjs', 'task', 'notification'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: '2026-04-20T17:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  desiredDueDate?: string;

  @ApiProperty({ type: [CandidateAssigneeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateAssigneeDto)
  candidates!: CandidateAssigneeDto[];
}
