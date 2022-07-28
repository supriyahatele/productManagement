const express = require("express")

const router = express.Router();

const { createUser, loginUser, getUser, updateProfile } = require('../Controllers/userController')
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../Controllers/productController')

const {authentication}=require('../middleware/auth')


//<======FEATURE 1 APIs=======>
router.post('/register', createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUser)
router.put("/user/:userId/profile", updateProfile)

//<======FEATURE 2 APIs=======>
router.post('/products', createProduct)
router.get('/products', getProducts)
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProduct)
router.delete('/products/:productId', deleteProduct)

module.exports = router