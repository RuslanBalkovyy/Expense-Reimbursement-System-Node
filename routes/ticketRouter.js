const express = require('express');
const { submitTicket, getPendingTickets, processTickets, viewTicketsAsEmployee } = require("../controllers/ticketController");
const authorizeRole = require("../middleware/roleMiddleware");
const router = express.Router();


router.get("/pending", authorizeRole, getPendingTickets);

router.get("/history", viewTicketsAsEmployee);

router.post("/", submitTicket);

router.post("/:ticketId", authorizeRole, processTickets);

module.exports = router;