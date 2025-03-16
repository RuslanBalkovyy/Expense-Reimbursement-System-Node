const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;
const loggerMiddleware = require("./src/middleware/loggingMiddleware");
const authenticateToken = require("./src/middleware/authMiddleware");
const ticketRouter = require("./src/routes/ticketRouter");
const userRouter = require("./src/routes/userRouter");

app.use(loggerMiddleware);

app.use('/users', userRouter);
app.use('/tickets', authenticateToken, ticketRouter);



app.listen(PORT, () => {
    console.log('Server is running on port 3000');
});