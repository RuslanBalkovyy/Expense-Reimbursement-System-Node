const { logger } = require('../util/logger');
const { submitTicket,
    getPendingTickets,
    processTicket,
    viewTicketsAsEmployee, uploadReceipt } = require('../services/ticketService');
const Joi = require('joi');

const schema = Joi.object({
    amount: Joi.number().min(0).required(),
    description: Joi.string().min(5).required(),
    type: Joi.string().valid("Travel", "Lodging", "Food", "Other").required(),
    receiptFileNames: Joi.forbidden()
})

const ticketValidation = (ticket) => {
    const { error, value } = schema.validate(ticket);
    if (error) {
        logger.warn(`Ticket validation failed: ${error.details[0].message}`);
        return { success: false, error: error.details[0].message };
    }
    logger.info("Ticket validation passed.");
    return { success: true };

};



const ticketSubmit = async (req, res) => {

    const ticket = req.body;
    const validation = ticketValidation(ticket);
    if (!validation.success) {
        logger.warn(`Ticket submission failed: ${validation.error}`);
        return res.status(400).json({ success: false, error: validation.error });
    }

    try {
        const response = await submitTicket(ticket, req.user.user_id);
        if (!response.success) {
            logger.warn(`Failed to submit ticket for user ID: ${req.user.user_id}. Error: ${response.error}`);
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
            logger.warn(`Failed to fetch pending tickets. Error: ${response.error}`);
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
        const { action } = req.body;
        if (!["Approved", "Denied"].includes(action)) {
            logger.warn(`Invalid action: ${action}. Action must be either "Approved" or "Denied".`);
            return res.status(400).json({ success: false, error: "Invalid action. Action must be either 'Approved' or 'Denied'." });
        }

        const response = await processTicket(req.params.ticketId, req.body.action, req.user.user_id);
        if (!response.success) {
            logger.warn(`Failed to process ticket ${ticketId}. Error: ${response.error}`);
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

        const { type } = req.query;
        const typeValidation = ["Travel", "Lodging", "Food", "Other"];

        if (type && !ticketValidation.includes(type)) {
            logger.warn(`Reimbursement type sould be one of:${typeValidation}`)
            return res.status(400).json({ success: false, error: "Invalid reimbursement type." });
        }

        const response = await viewTicketsAsEmployee(req.user.user_id, type);

        if (!response.success) {
            logger.warn(`Failed to fetch ticket history for user ID: ${req.user.user_id}. Error: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        }
        logger.info(`Ticket history fetched successfully for user ID: ${req.user.user_id}`);
        return res.status(200).json({ success: true, tickets: response.tickets });
    } catch (error) {
        logger.error(`Error in viewHistory: ${error.message}`, error);
        return res.status(500).json({ success: false, error: "An unexpected error occurred while fetching ticket history." });
    };
};



async function receiptUpload(req, res) {
    try {
        if (!req.file) {
            logger.warn("No file uploaded.");
            return res.status(400).send("No file uploaded.");
        };

        const response = await uploadReceipt(req.user.userId, req.param.ticketId, req.file);
        if (!response.success) {
            logger.warn("Receipt upload failed.");
            return res.status(500).send("Receipt upload failed.");
        };
        logger.info("Receipt uploaded successfully.");
        return res.status(201).json({ success: true, ticket: response.ticket });

    } catch (error) {
        logger.error("Error uploading receipt:", error);
        return res.status(500).send("Internal server error.");
    }

}

module.exports = {
    ticketSubmit,
    getPendingTicketsList,
    processTickets,
    viewHistory, receiptUpload
};