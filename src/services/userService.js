const { logger } = require('../util/logger');
const { createUser, getUserByUsername, getUser, updateUserRole } = require('../models/userModel');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { updateUser } = require('../models/ticketModel');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;


async function registration(user) {
    try {

        const existingUser = await getUserByUsername(user.username);

        if (existingUser) {
            logger.warn(`Username "${user.username}" already exists in the database.`);
            return { success: false, error: "Username already exists." };
        }
        user.user_id = uuidv4();
        user.role = "Employee";

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
            logger.warn(`User with username ${user.username} doesn't exist.`);
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
}


async function changeUserRole(user_id, newRole) {
    try {

        const validRole = ["Employee", "Manager"];

        if (!validRole.includes(newRole)) {
            logger.warn(`Invalid role "${newRole}".`);
            return { success: false, error: "Invalid role. Role could only be 'Employee' or 'Manager'." };
        };

        const user = await getUser(user_id);
        if (!user) {
            logger.warn(`User with username ${user.username} doesn't exist.`);
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

        const response = await updateUserRole(user_id, newRole);
        if (!response) {
            logger.warn();//fill logger
            return {
                success: false,
                error: ""//fill the error message
            }
        }
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

}

async function updateAccount(user_id, value) {
    try {
        const user = await getUser(user_id);
        if (!user) {
            logger.warn()//TODO fill the logger
            return { success: false, error: "User not found." };
        }

        const response = await updateUser(user_id, updatedData);
        if (!response) {
            logger.warn()//fill the logger
            return {
                success: false,
                error: "Error while "//fill error message
            }
        }

        logger.info(`Successfully updated account info for user ${user_id}`);
        return { success: true, message: "User successfully updated." };
    } catch (error) {
        logger.error(`Error while updating details for user ${user_id}`, error);
        return { success: false, error: "Unexpected errot while updating user details." };
    }
}


module.exports = { registration, login, changeUserRole, updateAccount };