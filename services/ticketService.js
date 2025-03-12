logger.info(`User "${user.username}" logged in successfully.`);
const { createTicket, getTicket, getAllTicketsByStatus,
    getAllTicketsByUserId, getAllTicketsForAdmin, updateTicket
} = require('../models/ticketModel');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { getUser } = require('../models/userModel');


const schema = Joi.object({
    user_id: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    description: Joi.string().min(5).required()
})


async function submitTicket(ticket, user_id) {
    try {
        const user = await getUser(user_id);
        if (!user) {
            logger.error(`User with ID ${user_id} does not exist.`);
            return { success: false, error: "User does not exist." };
        };

        const { error, value } = schema.validate(ticket);
        if (error) {
            logger.error(`Ticket validation failed: ${error.details[0].message}`);
            return { success: false, error: error.details[0].message };
        }
        logger.info("Ticket validation passed.");

        const validatedTicket = value;
        validatedTicket.ticket_id = uuidv4();
        validatedTicket.status = "Pending";
        validatedTicket.user_id = user_id;
        validatedTicket.created_at = new Date().toISOString();


        const createdTicket = await createTicket(validatedTicket);

        if (!createdTicket) {
            logger.error("Database operation failed while creating the ticket.");
            return { success: false, error: "Failed to create ticket due to a database issue." };
        }


        logger.info(`Ticket created successfully with ID: ${validatedTicket.ticket_id}`);
        return {
            success: true,
            ticket: {
                ticket_id: validatedTicket.ticket_id,
                amount: validatedTicket.amount,
                description: validatedTicket.description,
                status: validatedTicket.status,
                created_at: validatedTicket.created_at
            }
        };

    }
    catch (error) {
        logger.error(`Error during ticket submission: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred during ticket submission." };
    }
}

async function getPendingTickets(user_id) {
    //possebly will move to auth module later
    try {
        const authUser = await getUser(user_id);
        if (!authUser || authUser.role !== "Manager") {
            logger.error(`Access denied for user ${user_id}. Role: ${authUser ? authUser.role : "Unknown"}`);
            return { success: false, error: "Permission denied. Only managers can view pending tickets." };
        }

        const tickets = await getAllTicketsByStatus("Pending");

        if (!tickets || tickets.length === 0) {
            logger.info("No pending tickets found.");
            return { success: false, error: "No pending tickets available for processing." };
        }

        tickets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        logger.info(`${tickets.length} pending ticket(s) retrieved.`);
        return { success: true, tickets: tickets };
    } catch (error) {
        logger.error(`Error retriecing tickets: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred during retrieving tickets." };
    }

}

async function processTicket(ticket_id, action) {
    const validActions = ["Approved", "Denied"];
    if (!validActions.includes(action)) {
        logger.error(`Invalid action "${action}" for ticket ${ticket_id}.`);
        return { success: false, error: "Invalid action. Tickets can only be Approved or Denied." };
    }


    let ticket = await getTicket(ticket_id);

    if (!ticket || ticket.status !== "Pending") {
        logger.error(`Cannot process ticket ${ticket_id}. Status: ${ticket ? ticket.status : "Not Found"}`);
        return { success: false, error: "Ticket cannot be processed. Either it does not exist or it is already processed." };
    }


    try {
        const response = await updateTicket(ticket_id, action);
        logger.info(`Ticket ${ticket_id} processed successfully. Action: ${action}`);
        return { success: true, ticket: response };
    } catch (error) {
        logger.error(`Failed to process ticket ${ticket_id}: ${error.message}`);
        return { success: false, error: "Failed to process ticket. Please try again later." };
    }
}

async function viewTicketsAsEmployee(user_id) {
    try {
        const user = await getUser(user_id);
        if (!user) {
            logger.error(`User with ID ${user_id} does not exist.`);
            return { success: false, error: "User does not exist." };
        }
        const tickets = await getAllTicketsByUserId(user_id);

        if (!tickets || tickets.length === 0) {
            logger.info(`No tickets found for user ID ${user_id}.`);
            return { success: false, message: "No previous tickets found." };
        };

        logger.info(`${tickets.length} ticket(s) retrieved for user ID ${user_id}.`);

        tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return {
            success: true,
            tickets: tickets.map(ticket => ({
                ticket_id: ticket.ticket_id,
                amount: ticket.amount,
                description: ticket.description,
                status: ticket.status,
                created_at: ticket.created_at
            }))
        };

    } catch (error) {
        logger.error(`Error retrieving tickets for user ID ${user_id}: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred while retrieving tickets." };

    }

}