import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class MarkReadDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
