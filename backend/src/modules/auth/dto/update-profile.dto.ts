import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Display name',
    minLength: 2,
    maxLength: 100,
    example: 'Minh Ngo',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL. If omitted, remains unchanged.',
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}
