const express = require("express")

const router = express.Router();

const { createUser, loginUser, getUser, updateProfile } = require('../Controllers/userController')
const {authentication}=require('../middleware/auth')

router.post('/register', createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUser)
router.put("/user/:userId/profile", authentication, updateProfile)

module.exports = router