import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { MulterError } from 'multer';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const requestId = request.header('x-request-id') ?? randomUUID();
    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') {
      const candidateDocument = request.path.includes('/context/');
      const code = candidateDocument ? 'CANDIDATE_DOCUMENT_TOO_LARGE' : 'AUDIO_FILE_TOO_LARGE';
      const message = candidateDocument ? 'Document exceeds the maximum size' : 'Audio file exceeds the maximum size';
      this.logFailure(request, requestId, HttpStatus.PAYLOAD_TOO_LARGE, code, exception);
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        code,
        message,
        retryable: false,
        requestId
      });
      return;
    }
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawMessage = exception instanceof HttpException ? exception.getResponse() : 'Unexpected server error';
    const errorBody = typeof rawMessage === 'string' ? undefined : rawMessage as { code?: string; message?: string | string[]; retryable?: boolean };
    const message = typeof rawMessage === 'string' ? rawMessage : errorBody?.message;
    const code = errorBody?.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_INVALID');
    this.logFailure(request, requestId, status, code, exception);

    response.status(status).json({
      code,
      message: Array.isArray(message) ? message.join(', ') : (message ?? 'Request failed'),
      retryable: errorBody?.retryable ?? status >= 500,
      requestId
    });
  }

  private logFailure(request: Request, requestId: string, status: number, code: string, exception: unknown): void {
    this.logger.warn(JSON.stringify({
      event: 'http.request_failed',
      requestId,
      method: request.method,
      path: request.originalUrl,
      status,
      code,
      exception: exception instanceof Error ? exception.name : 'UnknownError'
    }));
  }
}
