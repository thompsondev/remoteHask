import type { Server } from 'http';

import type { INestApplication } from '@nestjs/common';

export function getHttpServer(app: INestApplication): Server {
  return app.getHttpServer() as Server;
}
