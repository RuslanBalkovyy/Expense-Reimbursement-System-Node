const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3000;
const loggerMiddleware = require("./middleware/loggingMiddleware");

const ticketRouter = require("./routes/ticketRouter");
const userRouter = require("./routes/userRouter");

app.use(loggerMiddleware);

app.use('/users', userRouter);
app.use('/tickets', ticketRouter);



app.listen(PORT, () => {
    console.log('Server is running on port 3000');
});