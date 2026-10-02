import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { transcriptionConfiguration } from '../transcription.config';

export class TranscriptionUploadDto {
  @ApiProperty({ example: 4200, minimum: 1, maximum: transcriptionConfiguration().maxDurationMs })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(transcriptionConfiguration().maxDurationMs)
  durationMs!: number;

  @ApiProperty({ required: false, format: 'uuid', description: 'Client-generated finalized-segment ID for idempotency and SSE correlation.' })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiProperty({ required: false, example: 1_735_689_600_000, description: 'Client-observed speech-end epoch milliseconds for latency measurement.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  speechEndedAtMs?: number;
}
