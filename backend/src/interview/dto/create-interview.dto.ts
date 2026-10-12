import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { INTERVIEW_ROLES, InterviewRole } from '../../roles/interview-role';

export class CreateInterviewDto {
  @ApiPropertyOptional({ enum: INTERVIEW_ROLES, default: 'devops' })
  @IsOptional()
  @IsIn(INTERVIEW_ROLES)
  role?: InterviewRole;
}
