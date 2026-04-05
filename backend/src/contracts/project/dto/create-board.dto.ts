import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Sprint Board' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Board for sprint execution' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
