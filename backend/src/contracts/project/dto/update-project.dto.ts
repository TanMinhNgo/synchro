import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '@/contracts/project/project.enums';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Synchro v1 (renamed)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: ['65f0c0d2e2d3d4f5a6b7c8d9'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
