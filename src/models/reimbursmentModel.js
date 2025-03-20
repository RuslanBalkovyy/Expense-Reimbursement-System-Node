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

    const command = new GetCommand({
        TableName: tableName,
        key: {
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
        if (key !== "userId" && key !== "PK" && key !== "SK") {
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
            PK: `USER#${user.userId}`,
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


// const user = {
//     PK: `USER#${userId}`,           // Primary key: includes a prefix and the user's unique id
//     SK: "PROFILE",                  // Sort key: constant value for user profiles
//     user_id: userId,                // Optional duplicate of the id if you wish to store it separately
//     username: "johndoe",            // Unique username (for example, used with a GSI to retrieve by username)
//     password: hashedPassword,       // The user's password after hashing
//     role: "Employee",               // Default role (could be "Manager" if changed later)
//     name: "John Doe",               // Optional: the user's full name
//     address: "123 Main St, Anytown",// Optional: address
//     profilePicture: "https://example.com/images/johndoe.jpg", // Optional: URL to profile picture
//     createdAt: new Date().toISOString() // Timestamp when the user is created
// };



async function createTicket(ticket) {

    const command = new PutCommand({
        TableName: tableName,
        Item: ticket
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Created new ticket for user: ${userId}, ticketId: ${ticketId}`);
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
        if (key !== "userId" && key !== "PK" && key !== "SK") {
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
            PK: `USER#${ticket.userId}`,
            SK: `TICKET#${ticket.ticketId}`
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW"
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Successfully updated ticket for user: ${ticket.userId}, ticketId: ${ticket.ticketId}`);
        return response.Attributes;
    } catch (error) {
        logger.error(`Error updating ticket for user: ${ticket.userId}, ticketId: ${ticket.ticketId}`, error);
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
        FilterExpression: "reimbType = :type",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":ticketPrefix": "TICKET#",
            ":type": type
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
    const command = new QueryCommand({
        TableName: tableName,
        IndexName: "StatusIndex",
        KeyConditionExpression: "status = :status",
        ExpressionAttributeValues: {
            ":status": status
        }
    });

    try {
        const response = await documentClient.send(command);
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

    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            PK: `USER#${ticket.userId}`,
            SK: `TICKET#${ticket.ticketId}`
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
        logger.error(`Error updating receiptFileName for ticket: ${ticket.ticketId}`, error);
        return null;
    }

};


// const ticket = {
//     PK: `USER#${userId}`,          // Partition key: user ID links tickets to the user
//     SK: `TICKET#${ticketId}`,      // Sort key: unique ticket ID
//     ticketId: ticketId,            // Ticket ID for unique identification
//     createdAt: new Date().toISOString(), // Timestamp when the ticket was created
//     amount: 250.75,                // Reimbursement amount
//     description: "Hotel booking for business trip", // Description of the ticket
//     reimbType: "Lodging",          // Reimbursement type (e.g., "Travel", "Food", etc.)
//     receiptFileNames: [],               // Receipt file name (can be populated later)
//     status: "Pending",             // Default status: "Pending"
//     type: "TICKET"                 // Identifies this item as a ticket in the table
// };


module.exports = {
    createUser, getUser, getUserByUsername, createTicket, getTicket, getTicketsByStatus, getTicketsByUserId, getTicketsByUserAndType, updateTicket, updateUser, appendRecieptName
};