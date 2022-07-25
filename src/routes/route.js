const express = require("express")

const router = express.Router();

const { createUser, loginUser, getUser, updateProfile } = require('../Controllers/userController')

router.post('/register', createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", getUser)
router.put("/user/:userId/profile", updateProfile)

module.exports = router