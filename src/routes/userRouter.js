const express = require('express');
const { userRegistration, userLogin, getUserAccount, changeRole, updateUserAccount } = require('../controllers/userController');
const router = express.Router();

router.post("/login", userLogin);
router.post("/register", userRegistration);
router.get("/account", getUserAccount);
router.patch("/:user_id", changeRole);
router.put("/account", updateUserAccount);

module.exports = router;