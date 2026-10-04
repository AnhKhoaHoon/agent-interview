import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ENDPOINT = 'publicEndpoint';
export const PublicEndpoint = () => SetMetadata(PUBLIC_ENDPOINT, true);
