require('dotenv').config();
const { documentClient } = require('../util/db');
const { GetCommand, PutCommand, UpdateCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { logger } = require('../util/logger');

const tableName = "ReimbursmentTable";

async function createUser(user) {

    const command = new PutCommand({
        TableName: tableName,
        Item: user
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Created new user: ${user.username}`);
        return response;
    } catch (error) {
        logger.error(`Error creating new user`, error);
        return null;
    };
};

async function getUser(userId) {
    console.log("userId:", userId);
    const command = new GetCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${userId}`,
            SK: "PROFILE"
        }
    });

    try {
        const response = await documentClient.send(command);
        if (response.Item) {
            logger.info(`Retrieved user: ${JSON.stringify(response.Item)}`);
            return response.Item;
        } else {
            logger.warn(`User with ID ${userId} not found`);
            return null;
        }
    } catch (error) {
        logger.error(`Error getting user ${userId}`, error);
        return null;
    };

};

async function getUserByUsername(username) {

    const command = new QueryCommand({
        TableName: tableName,
        IndexName: "UsernameIndex",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
            ":username": username
        }
    });

    try {
        const response = await documentClient.send(command);
        if (response.Items && response.Items.length > 0) {
            logger.info(`Retrieved user: ${JSON.stringify(response.Items[0])}`);
            return response.Items[0];
        } else {
            logger.warn(`No user found with username ${username}`);
            return null;
        }
    } catch (error) {
        logger.error(`Error while getting user with username ${username}`, error);
        return null;
    }

};

async function updateUser(user) {
    let updateExpression = "SET ";
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(user).forEach((key, index) => {
        if (key !== "user_id" && key !== "PK" && key !== "SK") {
            const attributeKey = `#key${index}`;
            const attributeValue = `:value${index}`;
            updateExpression += `${attributeKey} = ${attributeValue}, `;
            ExpressionAttributeNames[attributeKey] = key;
            ExpressionAttributeValues[attributeValue] = user[key];
        }
    });

    updateExpression = updateExpression.slice(0, -2);

    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${user.user_id}`,
            SK: "PROFILE"
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Successfully updated user: ${user.userId}`);
        return response.Attributes;
    } catch (error) {
        logger.error(`Error updating user: ${user.userId}`, error);
        return null;
    }
}



async function createTicket(ticket) {

    const command = new PutCommand({
        TableName: tableName,
        Item: ticket
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Created new ticket for user: ${ticket.user_id}, ticketId: ${ticket.ticket_id}`);
        return response;
    } catch (error) {
        logger.error(`Error creating ticket for user: ${userId}`, error);
        return null;
    }
};

async function getTicket(ticketId) {

    const command = new QueryCommand({
        TableName: tableName,
        IndexName: "TicketIndex",
        KeyConditionExpression: "ticket_id = :ticketId",
        ExpressionAttributeValues: {
            ":ticketId": ticketId
        }
    });

    try {
        const response = await documentClient.send(command);
        if (response.Items && response.Items.length > 0) {
            logger.info(`Retrieved ticket: ${JSON.stringify(response.Items[0])}`);
            return response.Items[0];
        } else {
            logger.warn(`Ticket with ID ${ticketId} not found.`);
            return null;
        }
    } catch (error) {
        logger.error(`Error while retrieving ticket with ID ${ticketId}`, error);
        return null;
    }

};

async function updateTicket(ticket) {
    let updateExpression = "SET ";
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.keys(ticket).forEach((key, index) => {
        if (key !== "user_id" && key !== "PK" && key !== "SK") {
            const attributeKey = `#key${index}`;
            const attributeValue = `:value${index}`;
            updateExpression += `${attributeKey} = ${attributeValue}, `;
            ExpressionAttributeNames[attributeKey] = key;
            ExpressionAttributeValues[attributeValue] = ticket[key];
        }
    });

    updateExpression = updateExpression.slice(0, -2);

    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${ticket.user_id}`,
            SK: `TICKET#${ticket.ticket_id}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Successfully updated ticket for user: ${ticket.user_id}, ticketid: ${ticket.ticket_id}`);
        return response.Attributes;
    } catch (error) {
        logger.error(`Error updating ticket for user: ${ticket.user_id}, ticketid: ${ticket.ticket_id}`, error);
        return null;
    }
};


async function getTicketsByUserId(userId) {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :ticketPrefix)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":ticketPrefix": "TICKET#"
        }
    });

    try {
        const response = await documentClient.send(command);
        if (response.Items && response.Items.length > 0) {
            logger.info(`Retrieved tickets for user ${userId}: ${JSON.stringify(response.Items)}`);
            return response.Items;
        } else {
            logger.warn(`No tickets found for user ${userId}.`);
            return [];
        }
    } catch (error) {
        logger.error(`Error retrieving tickets for user ${userId}`, error);
        return null;
    }

};

async function getTicketsByUserAndType(userId, type) {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :ticketPrefix)",
        FilterExpression: "#type = :type",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":ticketPrefix": "TICKET#",
            ":type": type
        },
        ExpressionAttributeNames: {
            "#type": "type"
        }
    });

    try {
        const response = await documentClient.send(command);
        if (response.Items && response.Items.length > 0) {
            logger.info(`Retrieved ${response.Items.length} tickets for user ${userId} with type '${type}': ${JSON.stringify(response.Items)}`);
            return response.Items;
        } else {
            logger.warn(`No tickets found for user ${userId} with type '${type}'.`);
            return [];
        }
    } catch (error) {
        logger.error(`Error retrieving tickets for user ${userId} with type '${type}':`, error);
        return [];
    }
}

async function getTicketsByStatus(status) {
    const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: "#status = :status",
        ExpressionAttributeValues: {
            ":status": status
        },
        ExpressionAttributeNames: {
            "#status": "status"
        }
    });

    try {
        const response = await documentClient.send(command);
        console.log(response);
        if (response.Items && response.Items.length > 0) {
            logger.info(`Retrieved ${response.Items.length} tickets with status '${status}'.`);
            return response.Items;
        } else {
            logger.warn(`No tickets found with status '${status}'.`);
            return [];
        }
    } catch (error) {
        logger.error(`Error retrieving tickets with status '${status}':`, error);
        return [];
    }
}

async function appendRecieptName(ticket) {
    const updateExpression = `SET receiptFileName = list_append(if_not_exists(receiptFileName, :emptyList), :newReceipt)`;
    const ExpressionAttributeValues = {
        ":emptyList": [],
        ":newReceipt": [ticket.newReceipt]
    };

    console.log(ticket)

    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${ticket.user_Id}`,
            SK: `TICKET#${ticket.ticket_Id}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Successfully updated receiptFileName for ticket: ${ticket.ticketId}`);
        return response.Attributes;
    } catch (error) {
        logger.error(`Error updating receipt FileName for ticket: ${ticket.ticketId}`, error);
        return null;
    }

};


module.exports = {
    createUser, getUser, getUserByUsername, createTicket, getTicket, getTicketsByStatus, getTicketsByUserId, getTicketsByUserAndType, updateTicket, updateUser, appendRecieptName
};