import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProjectColumnKey } from '@/contracts/project/project.enums';

export class TransitionTaskDto {
  @ApiProperty({
    enum: ProjectColumnKey,
    example: ProjectColumnKey.in_progress,
  })
  @IsEnum(ProjectColumnKey)
  columnKey!: ProjectColumnKey;
}
