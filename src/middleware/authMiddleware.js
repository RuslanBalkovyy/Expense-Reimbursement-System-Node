const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const { logger } = require('../util/logger');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn("Authentication failed: Tocken required");
        return res.status(403).json({
            success: false,
            error: "Token required"
        });
    };

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            logger.warn("Authentication failed: Invalid or expired tocken");
            return res.status(403).json({
                success: false,
                error: "Invalid or expired tocken"
            });
        };
        logger.info("Authentification successful");
        req.user = user;
        next();
    });

};


module.exports = authenticateToken;