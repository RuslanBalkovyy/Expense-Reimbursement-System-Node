const { logger } = require('../util/logger');
const { createUser, getUserByUsername } = require('../models/userModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;


async function registration(user) {
    try {

        const existingUser = await getUserByUsername(user.username);

        if (existingUser) {
            logger.error(`Username "${user.username}" already exists in the database.`);
            return { success: false, error: "Username already exists." };
        }
        user.user_id = uuidv4();
        user.role = "employee";

        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;


        const createdUser = await createUser(user);


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
    }
}


async function login(user) {
    try {

        const userFromDB = await getUserByUsername(user.username);
        if (!userFromDB) {
            logger.error(`User with username ${user.username} doesn't exist.`);
            return {
                success: false,
                error: "No such username in database."
            };
        }

        const matchPass = await bcrypt.compare(user.password, userFromDB.password);

        if (matchPass) {
            logger.info(`User "${user.username}" logged in successfully.`);

            const token = jwt.sign(
                {
                    user_id: userFromDB.user_id,
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
            logger.error(`User login failed. Username: ${user.username}. Reason: Password doesn't match.`);
            return {
                success: false,
                error: "Password doesn't match."
            }
        }


    } catch (error) {
        logger.error(`Error during login: ${error.message}`, error);
        return { success: false, error: "An unexpected error occurred during login." };
    }
}

module.exports = { registration, login };