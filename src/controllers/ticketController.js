const { logger } = require('../util/logger');
const { submitTicket,
    getPendingTickets,
    processTicket,
    viewTicketsAsEmployee } = require('../services/ticketService');
const Joi = require('joi');

const schema = Joi.object({
    user_id: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    description: Joi.string().min(5).required()
})

const ticketValidation = (ticket) => {
    const { error, value } = schema.validate(ticket);
    if (error) {
        logger.error(`Ticket validation failed: ${error.details[0].message}`);
        return { success: false, error: error.details[0].message };
    }
    logger.info("Ticket validation passed.");
    return { success: true };

};

const submitTicket = async (req, res) => {

    const ticket = req.body;
    const validation = ticketValidation(ticket);
    if (!validation.success) {
        logger.error(`Ticket submission failed: ${validation.error}`);
        return res.status(400).json({ success: false, error: validation.error });
    }

    try {
        const response = await submitTicket(ticket, req.user.user_id);
        if (!response.success) {
            logger.error(`Failed to submit ticket for user ID: ${req.user.user_id}. Error: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        };

        logger.info(`Ticket submitted successfully by user ID: ${req.user.user_id}`);
        return res.status(201).json({ success: true, message: "Ticket submitted successfully.", ticket: response.ticket });
    } catch (error) {
        logger.error(`Error in submitTicket: ${error.message}`, error);
        return res.status(500).json({ success: false, error: "An unexpected error occurred while submitting the ticket." });
    };

};

const getPendingTicketsList = async (req, res) => {
    try {
        const response = await getPendingTickets();
        if (!response.success) {
            logger.error(`Failed to fetch pending tickets. Error: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        }

        const message = req.query.message;

        logger.info(`Fetched ${response.tickets.length} pending tickets.`);
        return res.status(200).json({
            success: true,
            message: message || null,
            tickets: response.tickets
        });
    } catch (error) {
        logger.error(`Error in getPendingTicketsList: ${error.message}`, error);
        return res.status(500).json({ success: false, error: "An unexpected error occurred while fetching pending tickets." });
    };

};


const processTickets = async (req, res) => {
    try {
        const response = await processTicket(req.params.ticketId, req.body.action);
        if (!response.success) {
            logger.error(`Failed to process ticket ${ticketId}. Error: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        }
        logger.info(`Ticket ${ticketId} processed successfully. Action: ${action}`);
        return res.status(200).json({ success: true, message: `Ticket ${ticketId} has been processed.`, ticket: response.ticket });
    } catch (error) {
        logger.error(`Error in processTickets: ${error.message}`, error);
        return res.status(500).json({ success: false, error: "An unexpected error occurred while processing the ticket." });
    };
};


const viewHistory = async (req, res) => {
    try {
        const response = await viewTicketsAsEmployee(req.user.user_id);

        if (!response.success) {
            logger.error(`Failed to fetch ticket history for user ID: ${req.user.user_id}. Error: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        }
        logger.info(`Ticket history fetched successfully for user ID: ${req.user.user_id}`);
        return res.status(200).json({ success: true, tickets: response.tickets });
    } catch (error) {
        logger.error(`Error in viewHistory: ${error.message}`, error);
        return res.status(500).json({ success: false, error: "An unexpected error occurred while fetching ticket history." });
    };
};

module.exports = {
    submitTicket,
    getPendingTicketsList,
    processTickets,
    viewHistory
};