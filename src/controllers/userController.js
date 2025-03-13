const { logger } = require("../util/logger");
const { registration, login } = require("../services/userService");
const Joi = require('joi');

const schema = Joi.object({
    username: Joi.string().min(3).max(16).required(),
    password: Joi.string().min(3).pattern(new RegExp('^(?=.*\\d)[A-Za-z\\d]{3,}$'))
        .required().messages({
            "string.min": "Password must be at least 3 characters long.",
            "string.pattern.base": "Password must include number."
        })
});

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



module.exports = { userLogin, userRegistration };