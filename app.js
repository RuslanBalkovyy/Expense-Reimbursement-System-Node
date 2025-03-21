const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;
const loggerMiddleware = require("./src/middleware/loggingMiddleware");
const authenticateToken = require("./src/middleware/authMiddleware");
const ticketRouter = require("./src/routes/ticketRouter");
const userRouter = require("./src/routes/userRouter");
require('dotenv').config();

const multer = require("multer");

app.use(loggerMiddleware);
app.use(express.json());


app.use('/users', userRouter);
app.use('/tickets', authenticateToken, ticketRouter);


app.use((req, res, next) => {
    const error = new Error(`Resource not found: ${req.path}`);
    error.status = 404;
    next(error);
});
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ success: false, error: "File size too large. Max 5MB allowed." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ success: false, error: "Unexpected file field name." });
        }
        if (err.code === "LIMIT_FIELD_COUNT") {
            return res.status(400).json({ success: false, error: "Too many files uploaded." });
        }
        if (err.message === "Field name missing") {
            return res.status(400).json({ success: false, error: "Field name is missing in the request." });
        }

        return res.status(400).json({ success: false, error: err.message });
    }

    return res.status(500).json({ success: false, error: `Internal server error:${err.message}` });
});
app.listen(PORT, () => {
    console.log('Server is running on port 3000');
});