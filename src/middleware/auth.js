const jwt = require("jsonwebtoken")
const userModel = require('../model/userModel')


//<<------------------------------------------------AUTHENTICATION------------------------------------------------------------>>
const authentication = function (req, res, next) {
    try {
        //const token = 
        
        if (req.headers.authorization){ //&& req.headers.authorization.split(' ')[0] === 'Bearer') {
            token =  req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).send({ status: false, msg: "Token missing" })
        }
        try {
            var decodedtoken = jwt.verify(token, "functionup-radon-secretKey", { ignoreExpiration: true }); 
            

            console.log(Date.now())
            
            if (Date.now() > decodedtoken.exp * 1000) { //Date.now() format in milliseconds, decodedtoken.exp is in seconds
                return res.status(401).send({ status: false, message: "token is expired" });
            }
            
        }
        catch (err) {
            return res.status(401).send({ status: false, msg: "token is invalid " })

        }

        req.decodedtoken = decodedtoken
        
        console.log("Successfully Authenticated")

        next()


    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

module.exports = {authentication};