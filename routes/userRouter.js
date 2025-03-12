const express = require('express');
const { userRegistration, userLogin } = require('../controllers/userController');
const router = express.Router();

router.post("/login", userLogin);
router.post("/register", userRegistration);

module.exports = router;