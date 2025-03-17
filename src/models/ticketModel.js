const { documentClient } = require('../util/db');
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
        logger.info(`Ticket successfully created.`)
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
        logger.info(`Retrieved ticket with id ${ticket_id}`);
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
        FilterExpression: "#user_id = :user_id",
        ExpressionAttributeNames: {
            "#user_id": "user_id"
        },
        ExpressionAttributeValues: {
            ':user_id': user_id
        }

    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Retrieved ${response.Count} tickets for user ID: ${user_id}`);
        return response.Items;
    } catch (error) {
        logger.error(`Error retrieving tickets for user ID: ${user_id}`, error);
        return null;
    }
}

async function getAllTicketsByUserIdAndType(user_id, type) {
    const command = new ScanCommand({
        TableName: "Tickets",
        FilterExpression: "#user_id = :user_id AND #type = :type",
        ExpressionAttributeValues: {
            ':user_id': user_id,
            ':type': type
        },
        ExpressionAttributeNames: {
            "#type": "type",
            "#user_id": "user_id"
        }
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Retrieved ${response.Count} tickets for user ID: ${user_id} with type:${type}`);
        return response.Items;
    } catch (error) {
        logger.error(`Error retrieving tickets for user ID: ${user_id} with type:${type}`, error);
        return null;
    }

}

async function getAllTicketsByStatus(status) {

    const command = new ScanCommand({
        TableName: "Tickets",
        FilterExpression: "#status = :status",
        ExpressionAttributeNames: {
            '#status': 'status'
        },
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
};


async function updateUser(user_id, data) {

    let updateExpression = "SET";
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(data).forEach((key, index) => {
        const attributeKey = `#key${index}`;
        const attributeValue = `:value${index}`;
        updateExpression += ` ${attributeKey} = ${attributeValue},`;
        ExpressionAttributeNames[attributeKey] = key;
        ExpressionAttributeValues[attributeValue] = updatedData[key];
    });

    updateExpression = updateExpression.slice(0, -1);


    const command = new UpdateCommand({
        TableName: "Users",
        Key: { user_id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
    })
    try {

        const response = await documentClient.send(command);
        logger.info(`User updated`);
        return response.Attributes;

    } catch (error) {
        logger.error(`Error while updating user details`, error);
        return null;
    }
}

module.exports = {
    createTicket, getTicket, getAllTicketsByStatus, getAllTicketsByUserId, updateTicket, getAllTicketsByUserIdAndType, updateUser
};