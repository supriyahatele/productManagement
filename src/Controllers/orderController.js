const userModel = require("../model/userModel")
const mongoose = require('mongoose');
const orderModel = require("../model/orderModel");
const cartModel = require("../model/cartModel");

let isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
}




// <================================================= POST /order ===============================================================>

const createOrder = async function (req, res) {
    try {

        let userId = req.params.userId
        userId = userId.trim()
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " provide a valid userId " });

        let findUser = await userModel.findOne({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: " user not found" })

        if (userId != req.decodedtoken.userId)
            return res.status(403).send({ status: false, msg: 'User unauthorized!' })

        let data = req.body
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "request Body cant be empty" });
        }

        let { cartId, cancellable, status } = data
       
        if (!cartId) return res.status(400).send({ status: false, message: "please provide cartId" })
        if (typeof cartId != "string") return res.status(400).send({ status: false, message: " Enter cartId in valid format!!! " });
        cartId = cartId.trim();
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: " enter a valid cartId " });
        let checkCart = await cartModel.findById({ _id: cartId }).select({ _id: 0, userId: 1, items: 1, totalPrice: 1, totalItems: 1 })
        if (!checkCart) return res.status(404).send({ status: false, message: " cart not found" })
        if(checkCart.totalPrice == 0 && checkCart.totalItems == 0) return res.status(404).send({ status: false, message: "cart not found" })

        let totalQuantity = 0
        for (i in checkCart.items) {
            totalQuantity += checkCart.items[i].quantity
        }
 


        let newObj = {
            userId: checkCart.userId,
            items: checkCart.items,
            totalPrice: checkCart.totalPrice,
            totalItems: checkCart.totalItems,
            totalQuantity: totalQuantity,
            
        }
        
        if (status) {
            if (typeof status != "string") return res.status(400).send({ status: false, message: "Status field Invalid format" })
            if (status != "pending") return res.status(400).send({ status: false, message: "Status field should be pending while creating an order" })
            newObj.status = status
        }

        if (keyValid(cancellable)) {
            if (typeof cancellable != "boolean") return res.status(400).send({ status: false, message: "Cancellable should be of Boolean type" })
            newObj.cancellable = cancellable;
        }
        
        let order = await orderModel.create(newObj)

        let deleteObject = { items: [], totalPrice: 0, totalItems: 0 }
        let deletedCart = await cartModel.findOneAndUpdate({ userId: userId }, deleteObject, { new: true })

      res.status(201).send({ status: true, message: "Success", data: order })
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

// <================================================= update /order ===============================================================>

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        userId = userId.trim()

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " provide a valid userId " });

        let findUser = await userModel.findById({ _id: userId })
        if (!findUser) return res.status(404).send({ status: false, message: " user not found" })

        //<=========Authorization===========>

        //check if the logged-in user is requesting to modify their own profile 
        if (userId != req.decodedtoken.userId)
            return res.status(403).send({ status: false, msg: 'User unauthorized!! loggedin is not allowed to modify the requested data' })


        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "request Body cant be empty" });
        }
        let { orderId,status } = req.body

        if (!orderId) return res.status(400).send({ status: false, msg: "plz provide orderId" })
        if (typeof orderId != "string") return res.status(400).send({ status: false, message: " Enter orderId in valid format!!! " });
        orderId = orderId.trim()
        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: " provide a valid orderId " });

        let findOrder = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!findOrder) return res.status(404).send({ status: false, message: "order not found for this user!!" })
        
        if (userId != findOrder.userId) return res.status(403).send({ status: false, message: "access denied!! trying to access someone else's order" })
        if(!status) return res.status(400).send({ status: false, message: "please provide status to update" })

        if (typeof status != "string") return res.status(400).send({ status: false, message: "Status field Invalid format" })
        if(status != 'cancelled'&& status != 'completed') return res.status(400).send({ status: false, message: "status value to update should be cancelled or completed" })

        if(findOrder.status == 'cancelled' || findOrder.status == 'completed') return res.status(400).send({ status: false, message: "this order is already closed, can't update further" })        
        

       if(status == 'cancelled'){
            if (findOrder.cancellable == false) return res.status(400).send({ status: false, message: "this order can't be cancelled!!!" })
       }

        findOrder.status = status;

        // if(status == 'cancelled'){
        //     findOrder.isDeleted = true; 
        //     findOrder.deletedAt = Date.now();
        // }

        findOrder.save();

        return res.status(200).send({ status: true, message: "Success", data: findOrder })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }

}

module.exports = { createOrder, updateOrder }

