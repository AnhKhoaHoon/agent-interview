import { Body, Controller, Get, Header, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable, from, map, switchMap } from 'rxjs';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { InterviewService } from './interview.service';
import { InterviewStreamService } from '../stream/interview-stream.service';
import { PublicEndpoint } from '../security/public-endpoint.decorator';

@ApiTags('interviews')
@Controller('interviews')
export class InterviewController {
  constructor(private readonly interviews: InterviewService, private readonly streams: InterviewStreamService) {}

  @Post()
  @PublicEndpoint()
  @ApiOperation({ summary: 'Create an interview session for the selected role' })
  @ApiResponse({ status: 201 })
  create(@Body() body: CreateInterviewDto): ReturnType<InterviewService['create']> {
    return this.interviews.create(body.role);
  }

  @Post(':id/end')
  @ApiBearerAuth()
  end(@Param('id') id: string): ReturnType<InterviewService['end']> {
    return this.interviews.end(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  get(@Param('id') id: string): ReturnType<InterviewService['get']> {
    return this.interviews.get(id);
  }

  @Get(':id/messages')
  @ApiBearerAuth()
  messages(@Param('id') id: string): ReturnType<InterviewService['listMessages']> {
    return this.interviews.listMessages(id);
  }

  @Post(':id/questions')
  @ApiBearerAuth()
  question(@Param('id') id: string, @Body() body: CreateQuestionDto): ReturnType<InterviewService['submitQuestion']> {
    return this.interviews.submitQuestion(id, body.question, body.language);
  }

  @Post(':id/questions/:questionId/answer/retry')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry a failed AI answer for one interviewer question' })
  @ApiResponse({ status: 201, description: 'The retry was accepted and streams through the interview SSE endpoint.' })
  retryAnswer(
    @Param('id') id: string,
    @Param('questionId') questionId: string
  ): ReturnType<InterviewService['retryAnswer']> {
    return this.interviews.retryAnswer(id, questionId);
  }

  @Post(':id/questions/:questionId/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Discard an incorrect interviewer transcript and stop its answer stream' })
  @ApiResponse({ status: 201, description: 'The transcript and any correlated answer were discarded.' })
  cancelQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string
  ): ReturnType<InterviewService['cancelQuestion']> {
    return this.interviews.cancelQuestion(id, questionId);
  }

  @Sse(':id/events')
  @ApiBearerAuth()
  @Header('X-Accel-Buffering', 'no')
  events(@Param('id') id: string): Observable<MessageEvent> {
    return from(this.interviews.get(id)).pipe(
      switchMap(() => this.streams.open(id)),
      map((event) => ({ type: event.type, data: event.data }))
    );
  }
}
