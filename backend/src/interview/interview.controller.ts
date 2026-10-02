import { Body, Controller, Get, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable, map } from 'rxjs';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { InterviewService } from './interview.service';
import { InterviewStreamService } from '../stream/interview-stream.service';

@ApiTags('interviews')
@Controller('interviews')
export class InterviewController {
  constructor(private readonly interviews: InterviewService, private readonly streams: InterviewStreamService) {}

  @Post()
  @ApiOperation({ summary: 'Create a DevOps interview session' })
  @ApiResponse({ status: 201 })
  create(@Body() _body: CreateInterviewDto): ReturnType<InterviewService['create']> {
    return this.interviews.create();
  }

  @Post(':id/end')
  end(@Param('id') id: string): ReturnType<InterviewService['end']> {
    return this.interviews.end(id);
  }

  @Get(':id')
  get(@Param('id') id: string): ReturnType<InterviewService['get']> {
    return this.interviews.get(id);
  }

  @Get(':id/messages')
  messages(@Param('id') id: string): ReturnType<InterviewService['listMessages']> {
    return this.interviews.listMessages(id);
  }

  @Post(':id/questions')
  question(@Param('id') id: string, @Body() body: CreateQuestionDto): { questionId: string; accepted: true } {
    return this.interviews.submitQuestion(id, body.question);
  }

  @Post(':id/questions/:questionId/answer/retry')
  @ApiOperation({ summary: 'Retry a failed AI answer for one interviewer question' })
  @ApiResponse({ status: 201, description: 'The retry was accepted and streams through the interview SSE endpoint.' })
  retryAnswer(
    @Param('id') id: string,
    @Param('questionId') questionId: string
  ): ReturnType<InterviewService['retryAnswer']> {
    return this.interviews.retryAnswer(id, questionId);
  }

  @Sse(':id/events')
  events(@Param('id') id: string): Observable<MessageEvent> {
    this.interviews.get(id);
    return this.streams.open(id).pipe(map((event) => ({ type: event.type, data: event.data })));
  }
}
