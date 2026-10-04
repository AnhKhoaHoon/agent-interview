import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { Request } from 'express';
import { InterviewRepository } from '../persistence/interview.repository';
import { PUBLIC_ENDPOINT } from './public-endpoint.decorator';

@Injectable()
export class InterviewAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly repository: InterviewRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ENDPOINT, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const interviewId = request.params.id;
    const authorization = request.header('authorization');
    const token = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (typeof interviewId !== 'string' || !token) throw new UnauthorizedException({ code: 'INTERVIEW_UNAUTHORIZED', message: 'Valid interview access token required', retryable: false });
    const tokenHash = createHash('sha256').update(token).digest('hex');
    if (!await this.repository.hasAccess(interviewId, tokenHash)) {
      throw new UnauthorizedException({ code: 'INTERVIEW_UNAUTHORIZED', message: 'Valid interview access token required', retryable: false });
    }
    return true;
  }
}
