const { logger } = require('../util/logger');
const { createUser, getUserByUsername, getUser, updateUser } = require('../models/reimbursmentModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
const REGION = process.env.AWS_DEFAULT_REGION;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const s3 = new S3Client({ region: REGION });


async function registration(user) {

    try {
        const existingUser = await getUserByUsername(user.username);
        if (existingUser) {
            logger.warn(`Username "${user.username}" already exists in the database.`);
            return { success: false, error: "Username already exists." };
        }

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(user.password, 10);

        const userPayload = {
            username: user.username,
            password: hashedPassword,
            role: "Employee",
            user_id: userId,
            PK: `USER#${userId}`,
            SK: "PROFILE"

        };

        const createdUser = await createUser(userPayload);
        if (!createdUser) {
            logger.error(`Failed to create user "${user.username}".`);
            return { success: false, error: "DB error while creating user" };
        };

        logger.info(`User "${createdUser.username}" created successfully with ID: ${createdUser.user_id}`);
        return {
            success: true,
            user: {
                username: createdUser.username,
                role: createdUser.role,
                user_id: createdUser.user_id
            }
        };

    } catch (error) {
        logger.error(`Error during registration: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred during registration." };
    };

};

async function login(user) {

    try {

        const userFromDB = await getUserByUsername(user.username);
        if (!userFromDB) {
            logger.warn(`User with username ${user.username} doesn't exist.`);
            return {
                success: false,
                error: "No such username in database."
            };
        };

        const matchPass = await bcrypt.compare(user.password, userFromDB.password);

        if (matchPass) {
            logger.info(`User "${user.username}" logged in successfully.`);

            const token = jwt.sign(
                {
                    userId: userFromDB.user_id,
                    username: userFromDB.username,
                    role: userFromDB.role
                },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            const { password, ...safeUserData } = userFromDB;
            return {
                success: true,
                user: safeUserData,
                token
            };
        }
        else {
            logger.warn(`User login failed. Username: ${user.username}. Reason: Password doesn't match.`);
            return {
                success: false,
                error: "Password doesn't match."
            }
        }

    } catch (error) {
        logger.error(`Error during login: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred during login." };
    }

};

async function changeUserRole(user_id, newRole) {

    try {
        const user = await getUser(user_id);
        if (!user) {
            logger.warn(`User with id ${user_id} doesn't exist.`);
            return {
                success: false,
                error: "No such username in database."
            };
        };

        if (user.role == newRole) {
            logger.warn(`User is already ${user.role}`);
            return {
                success: false,
                error: "User already has that role"
            };
        };
        const userInput = {
            userId: user_id,
            role: newRole
        };


        const response = await updateUser(userInput);
        if (!response) {
            logger.warn(`Failed to update role for user ${user_id} to ${newRole}.`);
            return {
                success: false,
                error: "Failed to update the user's role. Please try again."
            };
        };
        logger.info(`Role of the user ${user_id} is changed to ${response.role}`);
        return {
            success: true,
            user: user_id,
            role: response.role
        };
    } catch (error) {
        logger.error(`Error during role changing: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred during role changing." };
    }
};


async function updateAccount(userId, user) {
    try {
        const userFromDB = await getUser(userId);
        if (!userFromDB) {
            logger.warn(`User with ID ${userId} not found.`);
            return { success: false, error: "User not found in the database." };
        }
        user.userId = userId;
        if (user.username) {
            logger.warn('Username cannot be changed.');
            return { success: false, error: 'Username cannot be changed.' };
        }

        const response = await updateUser(user);
        if (!response) {
            logger.warn(`Failed to update user ${userId}.`);
            return {
                success: false,
                error: "Failed to update the user. Please try again later."
            };
        }



        logger.info(`Successfully updated account info for user ${userId}`);
        return { success: true, message: "User successfully updated." };
    } catch (error) {
        logger.error(`Error while updating details for user ${userId}`, error);
        return { success: false, error: "Unexpected error while updating user details." };
    }
};


async function uploadAvatar(userId, file) {
    try {
        const user = await getUser(userId);
        if (!user) {
            logger.warn('User not found');
            return { success: false, error: 'User not found' };
        }

        const fileName = `${userId}/avatar/${Date.now()}_${file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimeType
        });

        await s3.send(command);


        const userPayload = {
            user_id: userId,
            profilePicture: fileName
        };
        const response = await updateUser(userPayload);
        if (!response) {
            logger.warn(`Failed to update avatar for user ${userId}.`);
            return { success: false, error: "Failed to update the user's avatar. Please try again." };
        }
        return { success: true, user: response };//TODO check if return only secure data
    } catch (error) {
        logger.error('Unexpected error during avatar upload.', error);
        return { success: false, error: 'Unexpected error during avatar upload.' };
    }
}


module.exports = { registration, login, changeUserRole, updateAccount, uploadAvatar }