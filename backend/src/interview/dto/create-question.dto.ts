import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is Kubernetes HPA?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4_000)
  question!: string;
}
