import logger from '@config/logger.js';
import app from '@/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`JobFolio API running on port ${PORT}`);
});
