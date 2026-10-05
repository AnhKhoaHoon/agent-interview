import { Body, Controller, Logger, Param, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { TranscriptionUploadDto } from './dto/transcription-upload.dto';
import { transcriptionConfiguration } from './transcription.config';
import { TranscriptionResponse, TranscriptionService, UploadedAudio } from './transcription.service';

@ApiTags('transcriptions')
@ApiBearerAuth()
@Controller('interviews/:id/transcriptions')
export class TranscriptionController {
  private readonly logger = new Logger(TranscriptionController.name);

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
        speechEndedAtMs: { type: 'integer', example: 1735689600000 },
        language: { type: 'string', enum: ['vi', 'en'], example: 'en' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Final transcript accepted into the interview chat.' })
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: transcriptionConfiguration().maxAudioBytes } }))
  transcribe(
    @Param('id') interviewId: string,
    @UploadedFile() audio: Express.Multer.File | undefined,
    @Body() body: TranscriptionUploadDto,
    @Req() request: Request
  ): Promise<TranscriptionResponse> {
    const requestId = request.header('x-request-id');
    this.logger.log(JSON.stringify({
      event: 'stt.upload.received',
      requestId,
      interviewId,
      segmentId: body.segmentId,
      durationMs: body.durationMs,
      speechEndedAtMs: body.speechEndedAtMs,
      language: body.language,
      audioPresent: Boolean(audio),
      ...(audio ? { audioBytes: audio.size, mimeType: audio.mimetype } : {})
    }));
    return this.transcriptions.transcribe(interviewId, audio as UploadedAudio | undefined, body.durationMs, {
      segmentId: body.segmentId,
      speechEndedAtMs: body.speechEndedAtMs,
      language: body.language,
      requestId
    });
  }
}
