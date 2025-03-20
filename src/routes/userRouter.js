const express = require('express');
const { userRegistration, userLogin, getUserAccount, changeRole, updateUserAccount, avatarUpload } = require('../controllers/userController');
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });


router.post("/login", userLogin);
router.post("/register", userRegistration);
router.get("/account", getUserAccount);
router.patch("/:user_id", changeRole);
router.put("/account", updateUserAccount);
router.post("/users/avatar", upload.single("image"), avatarUpload);


module.exports = router;