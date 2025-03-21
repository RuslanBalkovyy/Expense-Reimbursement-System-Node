const express = require('express');
const { userRegistration, userLogin, getUserAccount, changeRole, updateUserAccount, avatarUpload } = require('../controllers/userController');
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");


router.post("/login", userLogin);
router.post("/register", userRegistration);
router.get("/account", authenticateToken, getUserAccount);
router.patch("/:user_id", authenticateToken, authorizeRole("Manager"), changeRole);
router.put("/account", authenticateToken, updateUserAccount);
router.post("/avatar", authenticateToken, upload.single("image"), avatarUpload);


module.exports = router;