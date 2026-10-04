import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { candidateContextConfiguration } from './candidate-context.config';
import { CandidateContextService } from './candidate-context.service';
import { CandidateContextSummary, UploadedCandidateDocument } from './candidate-context.types';

@ApiTags('candidate-context')
@ApiBearerAuth()
@Controller('interviews/:id/context')
export class CandidateContextController {
  constructor(private readonly contexts: CandidateContextService) {}

  @Get()
  @ApiOperation({ summary: 'List the CV and job-description contexts attached to this interview without returning their text' })
  list(@Param('id') interviewId: string): Promise<CandidateContextSummary[]> {
    return this.contexts.list(interviewId);
  }

  @Delete(':kind')
  @ApiOperation({ summary: 'Remove a CV/profile or job-description context from this interview' })
  @ApiResponse({ status: 200, description: 'The normalized context was removed.' })
  remove(@Param('id') interviewId: string, @Param('kind') kind: string): Promise<{ removed: boolean }> {
    return this.contexts.remove(interviewId, kind);
  }

  @Post(':kind')
  @ApiOperation({ summary: 'Upload a CV/profile or job description for candidate-aware interview answers' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['document'], properties: { document: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Normalized document text was saved; the raw file is discarded.' })
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: candidateContextConfiguration().maxBytes } }))
  upload(
    @Param('id') interviewId: string,
    @Param('kind') kind: string,
    @UploadedFile() document: Express.Multer.File | undefined
  ): Promise<CandidateContextSummary> {
    return this.contexts.upload(interviewId, kind, document as UploadedCandidateDocument | undefined);
  }
}
