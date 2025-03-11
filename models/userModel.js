const { documentClient } = require('../config/db');
const { GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { logger } = require("../util/logger");
const { ScanCommand } = require('@aws-sdk/client-dynamodb');

async function createUser(user) {
    const command = new PutCommand({
        TableName: "Users",
        Item: user
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Created new user: ${user.username}`);
        return response;
    } catch (error) {
        logger.error(`Error creating new user`, error);
        return null;
    }
}

async function getUser(user_id) {
    const command = new GetCommand({
        TableName: "Users",
        Key: { user_id }
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Retrieved user: ${JSON.stringify(response.Items)}`);
        return response.Item;
    } catch (error) {
        logger.error(`Error getting user ${user_id}`, error);
        return null;
    }
}

async function getUserByUsername(name) {
    const command = new ScanCommand({
        TableName: "Users",
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': name
        }
    })
    try {
        const response = await documentClient.send(command);
        logger.info(`Retrieved user: ${JSON.stringify(response.Items[0])}`);
        return response.Items[0];
    } catch (error) {
        logger.error(`Error while getting user with username ${name}`, error);
        return null;
    }

}

async function updateUserRole(user_id, newRole) {
    const command = new UpdateCommand({
        TableName: "Users",
        Key: { user_id },
        UpdateExpression: "SET role = :role",
        ExpressionAttributeValues: {
            ":role": newRole
        },
        ReturnValues: "UPDATED_NEW"
    });

    try {
        const response = await documentClient.send(command);
        logger.info(`Succesfully updated role for user ${user_id}, to ${newRole}`);
        return response.Attributes;
    } catch (error) {
        logger.error(`Error updation role for user ${user_id}`, error);
        return null;
    }


}

module.exports = { createUser, getUser, getUserByUsername, updateUserRole }