import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class CreateInterviewDto {
  @ApiPropertyOptional({ enum: ['devops'], default: 'devops' })
  @IsOptional()
  @IsIn(['devops'])
  role?: 'devops';
}
