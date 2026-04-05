import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ProjectColumnKey } from '@/contracts/project/project.enums';

export class CreateColumnDto {
  @ApiProperty({ enum: ProjectColumnKey, example: ProjectColumnKey.backlog })
  @IsEnum(ProjectColumnKey)
  key!: ProjectColumnKey;

  @ApiProperty({ example: 'Backlog' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  order?: number;
}
