const express = require("express")

const router = express.Router();

const { createUser, loginUser, getUser, updateProfile } = require('../Controllers/userController')
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../Controllers/productController')
const {addToCart,updateCart, getCartById, deleteCart} = require('../Controllers/cartController')
const {createOrder, updateOrder} = require('../Controllers/orderController')
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

//<======FEATURE 3 APIs=======>
router.post('/users/:userId/cart',authentication,addToCart)
router.put('/users/:userId/cart',authentication,updateCart)
router.get('/users/:userId/cart',authentication,getCartById)
router.delete('/users/:userId/cart',authentication,deleteCart)

//<======FEATURE 3 APIs=======>
router.post('/users/:userId/orders',authentication,createOrder)
router.put('/users/:userId/orders',authentication,updateOrder)


module.exports = router

