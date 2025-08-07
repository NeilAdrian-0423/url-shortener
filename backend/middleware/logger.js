import { logger } from '../server.js';

export const logRequest = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        if (res.statusCode >= 400) {
            logger.warn('Request failed', logData);
        } else {
            logger.info('Request completed', logData);
        }
    });

    next();
};

export const logDatabaseQuery = (query, params) => {
    logger.debug('Database query', {
        query: query.substring(0, 100), // Truncate long queries
        params: params ? params.slice(0, 3) : [] // Log first 3 params only
    });
};