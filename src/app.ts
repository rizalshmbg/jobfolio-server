import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'JobFolio API is running',
    });
});

export default app;
