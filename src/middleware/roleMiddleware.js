const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (userRole !== requiredRole) {
            return res.status(403).json({ success: false, error: `Access denied. You must be a ${requiredRole} to access this route.` });
        }

        next();
    };
};

module.exports = authorizeRole;


// if (!authUser || authUser.role !== "Manager") {
//     logger.error(`Access denied for user ${user_id}. Role: ${authUser ? authUser.role : "Unknown"}`);
//     return { success: false, error: "Permission denied. Only managers can view pending tickets." };
// }