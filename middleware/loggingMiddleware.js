const { logger } = require("../util/logger");

function loggerMiddleware(req, res, next) {
    logger.info(`Incoming ${req.method} : ${req.url}`);
    next();
}

module.exports = loggerMiddleware;