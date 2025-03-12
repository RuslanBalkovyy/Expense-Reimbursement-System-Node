const express = require('express');
const { submitTicket, getPendingTickets, processTickets, viewTicketsAsEmployee } = require("../controllers/ticketController");
const router = express.Router();


router.get("/pending", getPendingTickets);

router.get("/history", viewTicketsAsEmployee);

router.post("/", submitTicket);

router.post("/:ticketId", processTickets);

module.exports = router;