const express = require("express")

const router = express.Router();

const { createUser, loginUser, getUser, updateProfile } = require('../Controllers/userController')
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../Controllers/productController')
const {addToCart,updateCart, getCartById, deleteCart} = require('../Controllers/cartController')

const {authentication}=require('../middleware/auth')


//<======FEATURE 1 APIs=======>
router.post('/register', createUser)
router.post("/login", loginUser)
router.get("/user/:userId/profile", authentication, getUser)
router.put("/user/:userId/profile", authentication, updateProfile)

//<======FEATURE 2 APIs=======>
router.post('/products', createProduct)
router.get('/products', getProducts)
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProduct)
router.delete('/products/:productId', deleteProduct)


//
router.post('/users/:userId/cart',addToCart)
router.put('/users/:userId/cart',updateCart)
router.get('/users/:userId/cart',getCartById)
router.delete('/users/:userId/cart',deleteCart)

module.exports = router

