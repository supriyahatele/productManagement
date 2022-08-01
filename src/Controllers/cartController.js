const mongoose = require('mongoose')
const cartModel = require('../model/cartModel')
const productModel = require('../model/productModel')
const userModel = require('../model/userModel')


const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};
const keyValid = (key) => {
    if (typeof key === 'undefined' || key === 'null') return false
    if (typeof key === 'string' && key.trim().length == 0) return false
    return true
}

let isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}


const addToCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        const Data = req.body;

        // validation starts
        if (!isValidRequestBody(Data)) {
            return res.status(400).send({ status: false, message: "Please provide valid requestBody" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please provide valid userId" })

        }
        let { cartId, productId, quantity } = Data

        const findCart = await cartModel.findOne({ userId: userId })
    
        if (findCart) {
           if (!cartId) return res.status(400).send({ status: false, message: "Please provide cart Id" })
            if (findCart._id.toString() != cartId) return res.status(400).send({ status: false, message: "cartId doesn't belongs to user" })
        }


        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Please provide valid ProductId" })
        }

        if (quantity <= 0) { return res.status(400).send({ msg: "Invalid Quantity!!" }) }

        if (!keyValid(quantity) ) {
            quantity = 1
        }

        

        const findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: "User doesn't exist"})

        // Authorization
        if (findUser._id.toString() != req.userId)
            return res.status(403).send({ status: false, message: "Unauthorized access! User's info doesn't match" })

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) {
            return res.status(404).send({ status: false, message: "Product doesn't exist " })
        }

        
        const findCartOfUser = await cartModel.findOne({ userId: userId })

        if (!findCartOfUser) {

            let priceSum = findProduct.price * quantity
            let itemArr = [{ productId: productId, quantity: quantity }]

            const newUserCart = await cartModel.create({
                userId: userId,
                items: itemArr,
                totalPrice: priceSum,
                totalItems: 1
            })
            return res.status(201).send({ status: true, message: "Success", data: newUserCart })
        }

       
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}
module.exports = { addToCart}