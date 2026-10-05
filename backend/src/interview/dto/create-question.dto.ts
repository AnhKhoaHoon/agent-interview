import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is Kubernetes HPA?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4_000)
  question!: string;

  @ApiPropertyOptional({ enum: ['vi', 'en'], default: 'en', description: 'Required answer language for this question.' })
  @IsOptional()
  @IsIn(['vi', 'en'])
  language?: 'vi' | 'en';
}
