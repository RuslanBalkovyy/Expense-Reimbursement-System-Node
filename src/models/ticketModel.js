const { documentClient } = require('../config/db');
const { GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { logger } = require('../util/logger');
const { ScanCommand } = require('@aws-sdk/client-dynamodb');


async function createTicket(ticket) {
    const command = new PutCommand({
        TableName: "Tickets",
        Item: ticket
    });

    try {
        await documentClient.send(command);
        return ticket;
    } catch (error) {
        logger.error(`Error while creating ticket`, error);
        return null;
    };
}

async function getTicket(ticket_id) {
    const command = new GetCommand({
        TableName: "Tickets",
        Key: { ticket_id }
    });

    try {
        const data = await documentClient.send(command);
        return data.Item;
    } catch (error) {
        logger.error(`Error retrieving ticket ${ticket_id}`, error);
        return null;
    };
}

async function updateTicket(ticket_id, status) {
    const command = new UpdateCommand({
        TableName: "Tickets",
        Key: { ticket_id },
        UpdateExpression: "SET status =:status",
        ExpressionAttributeValues: {
            ":status": status
        },
        ReturnValues: "UPDATED_NEW"
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Ticket ${ticket_id} updated. Status set to ${response.Attributes.status}`);
        return response.Attributes;
    } catch (error) {
        logger.error(`Error updating ticket ${ticket_id}`, error);
        return null;
    };

}


async function getAllTicketsByUserId(user_id) {

    const command = new ScanCommand({
        TableName: "Tickets",
        FilterExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
            ':user_id': user_id
        }

    })

    try {
        const response = await documentClient.send(command);
        logger.info(`Retrieved ${response.Count} tickets for user ID: ${user_id}`);
        return response.Items;
    } catch (error) {
        logger.error(`Error retrieving tickets for user ID: ${user_id}`, error);
        return null;
    }
}
async function getAllTicketsByStatus(status) {

    const command = new ScanCommand({
        TableName: "Tickets",
        FilterExpression: "status = :status",
        ExpressionAttributeValues: {
            ':status': status
        }

    })

    try {

        const response = await documentClient.send(command);
        logger.info(`retrieved tickets with status: ${status}`);
        return response.Items;

    } catch (error) {
        logger.error(`Error getting all tickets with status ${status}`, error);
        return null;
    }
}
async function getAllTicketsForAdmin() {

    const command = new ScanCommand({
        TableName: "Tickets"

    })

    try {

        const response = await documentClient.send(command);
        logger.info(`Retrieved all tickets`);
        return response.Items;

    } catch (error) {
        logger.error(`Error retrieving all tickets`, error);
        return null;
    }
}

module.exports = {
    createTicket, getTicket, getAllTicketsByStatus, getAllTicketsByUserId, getAllTicketsForAdmin, updateTicket
}