import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsIn,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AssistantChatMessageDto {
  @ApiProperty({ example: 'user', enum: ['system', 'user', 'assistant'] })
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  @MinLength(2)
  @MaxLength(16)
  role!: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'Give me a quick project update.' })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content!: string;
}

export class AssistantChatDto {
  @ApiProperty({ type: [AssistantChatMessageDto] })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AssistantChatMessageDto)
  messages!: AssistantChatMessageDto[];

  @ApiPropertyOptional({ example: 0.4 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ example: 512 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(4096)
  maxTokens?: number;
}
