import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AnalyzeTaskReportDto {
  @ApiProperty({
    example:
      'Implemented OAuth callback and fixed token refresh race condition. Added tests for auth guards.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  reportText!: string;

  @ApiPropertyOptional({ example: 65, description: 'Claimed progress percent' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @ApiPropertyOptional({
    example: 6,
    description: 'Worked hours in this report',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  workedHours?: number;

  @ApiPropertyOptional({ example: 'Waiting for API key from partner team.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  blockers?: string;

  @ApiPropertyOptional({
    example: 'Complete integration tests and move to review.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  nextActions?: string;

  @ApiPropertyOptional({ example: '2026-04-10T10:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Send inbox notifications to assignees and reporter',
  })
  @IsOptional()
  @IsBoolean()
  notifyInInbox?: boolean;
}
