import { Body, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TranscriptionUploadDto } from './dto/transcription-upload.dto';
import { transcriptionConfiguration } from './transcription.config';
import { TranscriptionResponse, TranscriptionService, UploadedAudio } from './transcription.service';

@ApiTags('transcriptions')
@Controller('interviews/:id/transcriptions')
export class TranscriptionController {
  constructor(private readonly transcriptions: TranscriptionService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audio', 'durationMs'],
      properties: {
        audio: { type: 'string', format: 'binary' },
        durationMs: { type: 'integer', example: 4200 },
        segmentId: { type: 'string', format: 'uuid' },
        speechEndedAtMs: { type: 'integer', example: 1735689600000 }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Final transcript accepted into the interview chat.' })
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: transcriptionConfiguration().maxAudioBytes } }))
  transcribe(
    @Param('id') interviewId: string,
    @UploadedFile() audio: Express.Multer.File | undefined,
    @Body() body: TranscriptionUploadDto
  ): Promise<TranscriptionResponse> {
    return this.transcriptions.transcribe(interviewId, audio as UploadedAudio | undefined, body.durationMs, {
      segmentId: body.segmentId,
      speechEndedAtMs: body.speechEndedAtMs
    });
  }
}
