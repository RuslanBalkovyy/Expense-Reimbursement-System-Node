const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        const user = req.user;

        if (user.role !== requiredRole) {
            logger.warn(`Access denied for user ${user.username}. Role: ${user ? user.role : "Unknown"}`);
            return res.status(403).json({ success: false, error: `Access denied. You must be a ${requiredRole} to access this route.` });
        }

        next();
    };
};

module.exports = authorizeRole;
