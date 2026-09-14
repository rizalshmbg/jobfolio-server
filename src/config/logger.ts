import pino from 'pino';
import { env } from '@config/env.js';

const logger = pino(
  env.NODE_ENV === 'development'
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        level: 'info',
      },
);

export default logger;
