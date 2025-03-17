const { logger } = require("../util/logger");
const { registration, login, changeUserRole, updateAccount } = require("../services/userService");
const Joi = require('joi');
const { getUser } = require("../models/userModel");

const schema = Joi.object({
    username: Joi.string().min(3).max(16).required(),
    password: Joi.string().min(3).pattern(new RegExp('^(?=.*\\d)[A-Za-z\\d]{3,}$'))
        .required().messages({
            "string.min": "Password must be at least 3 characters long.",
            "string.pattern.base": "Password must include number."
        })
});

const profileSchema = Joi.object({
    name: Joi.string,
    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        zip: Joi.string().pattern(/^\d{5}$/).optional()
    }).optional(),
    profile_picture: Joi.string().uri().optional()
})

const creadentialsValidation = (user) => {
    const { error, value } = schema.validate(user);
    if (error) {
        logger.warn(`Error while validationg credentials: ${error.details[0].message}`);
        return { success: false, error: error.details[0].message };;
    } else {
        logger.info("Validation passed");
        return { success: true };
    }
};

const userRegistration = async (req, res) => {
    try {
        const validation = creadentialsValidation(req.body);
        if (!validation.success) {
            logger.warn(`Registration failed: ${validation.error}`);
            return res.status(400).json({ success: false, error: validation.error });
        };

        const response = await registration(req.body);
        if (!response.success) {
            logger.warn(`Registration failed for username ${username}: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        }

        logger.info(`User registered successfully: ${response.user.username}`);
        return res.status(201).json({ success: true, user: response.user });
    } catch (error) {
        logger.error(`Unexpected error occured during registration: ${error.message}`);
        return res.status(500).json({ success: false, error: "An unexpected error occured during registration" });
    }

}
const userLogin = async (req, res) => {
    try {
        const validation = creadentialsValidation(req.body);
        if (!validation.success) {
            logger.warn(`Login failed: ${validation.error}`);
            return res.status(400).json({ success: false, error: validation.error });
        };

        const response = await login(req.body);
        if (!response.success) {
            logger.warn("Login failed: Username and password don't match.");
            return res.status(401).json({ success: false, error: response.error });
        }
        logger.info(`User ${response.user.user_id} succesfully logen in.`)
        return res.status(200).json({
            success: true,
            user: response.user,
            token: response.token
        });
    } catch (error) {
        logger.error(`Unexpected error occured during login: ${error.message}`);
        res.status(500).json({ success: false, error: "An unexpected error occured during login" });
    }
}


const changeRole = async (req, res) => {


    try {
        const response = await changeUserRole(req.param.user_id, req.body.role);

        if (!response.success) {
            logger.warn(`Error during updating role: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        };

        logger.info(`Role for user ${req.param.user_id} is succesfully changed to ${req.body.role}.`);
        return res.status(200).json({
            success: true,
            role: response.role
        });

    } catch (error) {
        logger.error(`Unexpected error occured during login: ${error.message}`);
        res.status(500).json({ success: false, error: "An unexpected error occured during login" });
    }

}

const getUserAccount = async (req, res) => {
    try {
        const user = await getUser(req.user.user_id);
        if (!user) {
            info.warn(`No user with id ${req.user.user_id}`);
            return res.status(400).json({
                succes: false,
                error: "No user found"
            })
        }

        logger.info();//TODO fill logger
        return res.statuf(200).json({
            succes: true,
            user: user
        })


    } catch (error) {
        logger.error(`Unexpected error occured during retrieving user's account: ${error.message}`);
        res.status(500).json({ success: false, error: "An unexpected error occured during retrieving user's account" });
    }

}

const updateUserAccount = async (req, res) => {
    //TODO


    try {
        //gather and validate all data

        const { error, value } = profileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        };

        const response = await updateAccount(req.user.user_id, value);
        if (!response.succes) {
            logger.warn();
            return res.status(400).json({
                success: false,
                error: response.error
            });
        };

        logger.info();//TODO fill logger

        return res.status(200).json({
            succes: true,
            message: "Profile updated succesfully"
        });

    } catch (error) {
        logger.error("Unexpected error while updating user profile");
        return res.status(500).json("Unexpected server error while updating user profile");
    }
}

module.exports = { userLogin, userRegistration, changeRole, getUserAccount, updateUserAccount };