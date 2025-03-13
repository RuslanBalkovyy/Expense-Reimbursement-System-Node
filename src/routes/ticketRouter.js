const express = require('express');
const { submitTicket, getPendingTicketsList, processTickets, viewHistory } = require("../controllers/ticketController");
const authorizeRole = require("../middleware/roleMiddleware");
const router = express.Router();


router.get("/pending", authorizeRole("Manager"), getPendingTicketsList);

router.get("/history", viewHistory);

router.post("/", submitTicket);

router.patch("/:ticketId", authorizeRole("Manager"), processTickets);

module.exports = router;