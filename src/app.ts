import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { pinoHttp } from 'pino-http';
import cookieParser from 'cookie-parser';

import logger from './config/logger.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import authRouter from './routes/auth.route.js';

const app: Express = express();

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'JobFolio API is running',
  });
});

app.use('/api/auth', authRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
