import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token.example',
    description: 'Optional if refresh token is present in httpOnly cookie',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  refreshToken?: string;
}
