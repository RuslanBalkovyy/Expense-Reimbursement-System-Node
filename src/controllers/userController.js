const { logger } = require("../util/logger");
const { registration, login, changeUserRole, updateAccount, uploadAvatar } = require("../services/userService");
const Joi = require('joi');
const { getUser } = require("../models/reimbursmentModel");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

require('dotenv').config();


const schema = Joi.object({
    PK: Joi.forbidden(),
    SK: Joi.forbidden(),
    username: Joi.string().min(3).max(16).required(),
    password: Joi.string().min(3).pattern(new RegExp('^(?=.*\\d)[A-Za-z\\d]{3,}$'))
        .required().messages({
            "string.min": "Password must be at least 3 characters long.",
            "string.pattern.base": "Password must include number."
        }),
});

const profileSchema = Joi.object({
    PK: Joi.forbidden(),
    SK: Joi.forbidden(),
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

        if (!["Employee", "Manager"].includes(req.body.role)) {
            logger.warn(`Invalid role: ${req.body.role}`);
            return res.status(400).json({ success: false, error: "Invalid role" });
        }
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
        const { PK, SK, password, ...safeData } = user;
        safeData.profilePicture = await getSignedUrl(S3Client, new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: safeData.profilePicture
        }), { expiresIn: 3600 });

        logger.info(`User account retrieved successfully for user id ${req.user.user_id}.`);
        return res.statuf(200).json({
            succes: true,
            user: safeData
        })


    } catch (error) {
        logger.error(`Unexpected error occured during retrieving user's account: ${error.message}`);
        res.status(500).json({ success: false, error: "An unexpected error occured during retrieving user's account" });
    }

}

const updateUserAccount = async (req, res) => {

    try {
        const { error } = profileSchema.validate(req.body);
        if (error) {
            logger.warn(`Profile update validation failed: ${error.details[0].message}`);
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const response = await updateAccount(req.user.user_id, req.body);
        if (!response.success) {
            logger.warn(`Profile update failed: ${response.error}`);
            return res.status(400).json({ success: false, error: response.error });
        }

        logger.info(`User profile updated successfully for user id ${req.user.user_id}.`);
        return res.status(200).json({ success: true, user: response.user });
    } catch (error) {
        logger.error(`Unexpected error occurred during profile update: ${error.message}`);
        res.status(500).json({ success: false, error: "An unexpected error occurred during profile update" });
    }
}


async function avatarUpload(req, res) {
    try {
        if (!req.file) {
            logger.warn("No file uploaded.");
            return res.status(400).send("No file uploaded.");
        };

        const response = await uploadAvatar(req.user.userId, req.file);
        if (!response.success) {
            logger.warn("Avatar upload failed.");
            return res.status(500).send("Avatar upload failed.");
        };
        logger.info("Avatar uploaded successfully.");
        return res.status(201).json({ success: true, user: response.user });

    } catch (error) {
        logger.error("Error uploading avatar:", error);
        return res.status(500).send("Internal server error.");
    }
}

module.exports = { userLogin, userRegistration, changeRole, getUserAccount, updateUserAccount, avatarUpload };