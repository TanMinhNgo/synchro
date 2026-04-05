import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ example: 'Bug' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @ApiPropertyOptional({ example: 'red' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;
}
