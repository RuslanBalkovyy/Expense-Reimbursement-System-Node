const { logger } = require("../util/logger");
const { registration, login } = require("../services/userService");

const userRegistration = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            logger.error("Registration failed: Username and password are required");
            return res.status(400).json({ error: "Username and password required!" });
        };

        const response = await registration(req.body);
        if (!response.success) {
            logger.error(`Registration failed for username ${username}: ${response.error}`);
            return res.status(400).json({ error: response.error });
        }

        logger.info(`User registered successfully: ${username}`);
        return res.status(201).json(response.user);
    } catch (error) {
        logger.error(`Unexpected error occured during registration: ${error.message}`);
        return res.status(500).json({ error: "An unexpected error occured during registration", message: error.message });
    }

}
const userLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            logger.error("Login failed: Username and password are required");
            return res.status(400).json({ error: "Username and password required!" });
        };

        const response = await login(req.body);
        if (!response.success) {
            logger.error("Login failed: Username and password don't match.");
            return res.status(401).json({ error: response.error });
        }
        return res.status(200).json(response.user);
    } catch (error) {
        logger.error(`Unexpected error occured during login: ${error.message}`);
        res.status(500).json({ error: "An unexpected error occured during login", message: error.message });
    }

}



module.exports = { userLogin, userRegistration };