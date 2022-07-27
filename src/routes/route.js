const express = require("express")

const router = express.Router();

const { createUser, loginUser, getUser, updateProfile } = require('../Controllers/userController')
const {createProduct} = require('../Controllers/productController')

const {authentication}=require('../middleware/auth')


//<======FEATURE 1 APIs=======>
router.post('/register', createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUser)
router.put("/user/:userId/profile", authentication, updateProfile)

//<======FEATURE 2 APIs=======>
router.post('/products', createProduct)

module.exports = router