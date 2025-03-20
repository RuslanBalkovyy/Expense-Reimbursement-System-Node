const express = require('express');
const { ticketSubmit, getPendingTicketsList, processTickets, viewHistory, receiptUpload } = require("../controllers/ticketController");
const authorizeRole = require("../middleware/roleMiddleware");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/pending", authorizeRole("Manager"), getPendingTicketsList);

router.get("/history", viewHistory);

router.post("/", ticketSubmit);

router.patch("/:ticketId", authorizeRole("Manager"), processTickets);

router.post("/:ticketId/receipts", upload.single("image"), receiptUpload)

module.exports = router;