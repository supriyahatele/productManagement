const userModel = require("../model/userModel")
const bcrypt = require('bcrypt');
//const aws = require("./aws")
const { uploadFile } = require("./aws");
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');



const keyValid = (key) => {
    if (typeof (key) === 'undefined' || typeof (key) === 'null') return false
    if (typeof (key) === 'String' && key.trim().length === 0) return false
    if (typeof (key) == 'Number' && key.toString().trim().length == 0) return false
    return true
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};

let NameRegex = /^(?![\. ])[a-zA-Z\. ]+(?<! )$/
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
let passwordRegex = /^[A-Za-z 0-9\d@$!%*?&]{8,15}$/
let addressStreetRegex = /[^a-zA-Z0-9 ]/
let addressCityRegex = /^[a-zA-Z ]+$/
let pincodeRegex = /^[1-9]\d{5}$/
let phoneRegex = /^[6-9]\d{9}$/


const createUser = async function (req, res) {
    try {
        let data = req.body
        let files = req.files


        if (!files || files.length == 0) return res.status(400).send({ status: false, message: "Please enter image file!!" })

        let { fname, lname, email, address, password, phone } = data
        address = JSON.parse(address)

        //console.log(address)
    fname = fname.trim()
        if (!keyValid(fname) || !NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Please enter a valid fname" })
        if (!keyValid(lname) || !NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Please enter a valid lname" })

        if (!keyValid(email)) return res.status(400).send({ status: false, message: "Please enter EmailId" })
        if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
        const findEmail = await userModel.findOne({ email: email })
        if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })

        if (!phone) return res.status(400).send({ status: false, message: "Phone number is required" })
        if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Phone Number! enter a valid Indian mobile umber" })
        const existingMobile = await userModel.findOne({ phone: phone })
        if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number already exists" })

        if (!password) return res.status(400).send({ status: false, message: "Password is required" })
        if (!passwordRegex.test(password)) return res.status(400).send({ status: false, message: "Invalid password!! Enter a password of 8-15 characters" })

        if (!address || Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please enter address!!" })
        //address = (data.address)

        if (!address.shipping) return res.status(400).send({ status: false, message: "Please enter shipping address and it should be in object!!" })
        else {

            let { street, city, pincode } = address.shipping;

            if (!keyValid(street)) return res.status(400).send({ status: false, message: "Enter shipping street" })
            if (!addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })

            if (!keyValid(city)) return res.status(400).send({ status: false, message: "Enter Shipping city" })
            if (!addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })

            if (!keyValid(pincode)) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
            if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })
        }


        //<======validating billing =====>


        if (!address.billing) return res.status(400).send({ status: false, message: "Please enter Billing address and it should be in object!!" })

        let { street, city, pincode } = address.billing;

        if (!keyValid(street)) return res.status(400).send({ status: false, message: "Please Enter Billing street Name" })

        if (!addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })

        if (!keyValid(city)) return res.status(400).send({ status: false, message: "Please enter Billing City Name" })
        if (!addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a Billing City Name" })


        if (!keyValid(pincode)) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
        if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })




        let uploadedFileURL = await uploadFile(files[0])
        data.profileImage = uploadedFileURL


        //let saltRounds = 10;
        let salt = await bcrypt.genSalt(10)
        //console.log(salt)
        let encryptedPassword = await bcrypt.hash(password, salt)
        //console.log(encryptedPassword)

        let data1 = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: uploadedFileURL,
            phone: phone,
            password: encryptedPassword,
            address: address

        }
        const createUser = await userModel.create(data1)
        return res.status(201).send({ status: true, data: createUser })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


const loginUser = async function (req, res) {
    try {
        let requestBody = req.body

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "requestBody cant be empty" });
        }

        let userName = requestBody.email;
        let password = requestBody.password;

        //Email validation
        if (!keyValid(userName)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        if (!(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/).test(userName)) {
            return res.status(400).send({ status: false, message: "Please provide valid Email Id" });
        }

        //Paeeword validation
        if (!keyValid(password)) {
            return res.status(400).send({ status: false, msg: "password is required" })
        }

        //User Present or Not
        let user = await userModel.findOne({ email: userName, password: password })
        if (!user) {
            return res.status(400).send({ status: false, msg: "Invalid Email or Password" })
        }

        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "radon",
                organization: "FunctionUp",
            },
            "functionup-radon-secretKey"
        );

        // res.setHeader("x-api-key", token);
        res.status(200).send({ status: true, token: token })

        return res.status(200).send({ status: true, token: token, msg: "author logged in successfully" });


    }
    catch (err) {
        return res.status(500).send(err.message);

    }
}

const getUser = async function (req, res) {
    try {
        const userId = req.params.userId;

        //<-----------------validating userId----------------------->

        //if userId is present
        // if(!userId){
        //     return res.status(400).send({ status: false, message: " Please provide a userId" });
        // }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: " enter a valid userId" });
        }

        //<---------------finding book with bookid----------------->
        const details = await userModel.findOne({ _id: userId });

        //console.log({...details});//<----check destructered output of moongodb call----->

        if (!details) {
            return res.status(404).send({ status: false, message: "Requested user not found!!!" });
        }

        res.status(200).send({ status: true, message: 'User profile details', data: details })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}

const updateProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, msg: "Please enter details in the request Body " }) }

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "not a correct id" })
        const checkUser = await userModel.findById(userId)
        if (!checkUser) return res.status(404).send({ status: false, msg: "user not found" })

        //<=====Validating fields to update======>
        let { fname, lname, email, address, password, phone } = data
        if (fname) {
            if (!keyValid(fname) || !NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Please enter fname" })
        }
        if (lname) {
            if (!keyValid(lname) || !NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Please enter lname" })
        }
        if (email) {
            if (!keyValid(email)) return res.status(400).send({ status: false, message: "Please enter EmailId" })
            if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
            const findEmail = await userModel.findOne({ email: email })
            if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })
        }

        if (phone) {
            if (!phone) return res.status(400).send({ status: false, message: "Phone number is required" })
            if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Number" })
            const existingMobile = await userModel.findOne({ phone: phone })
            if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number is already exists" })
        }

        if (address) {
            if (!address || Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please enter address and it should be in object!!" })
            //address = (data.address)


            if(address.shipping){
            //if (!address.shipping) return res.status(400).send({ status: false, message: "Please enter shipping address and it should be in object!!" })

            if(address.shipping.street){
            //if (!keyValid(address.shipping.street)) return res.status(400).send({ status: false, message: "Enter shipping street" })
            if (!addressStreetRegex.test(address.shipping.street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })
            }
            if (!keyValid(address.shipping.city)) return res.status(400).send({ status: false, message: "Enter Shipping city" })
            if (!addressCityRegex.test(address.shipping.city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })

            if (!pincodeRegex.test(address.shipping.pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })
            }
            if (!address.billing) return res.status(400).send({ status: false, message: "Please enter Billing address and it should be in object!!" })

            if (!keyValid(address.billing.street)) return res.status(400).send({ status: false, message: "Please Enter Billing street Name" })
            if (!addressStreetRegex.test(address.billing.street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })

            if (!keyValid(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter Billing City Name" })
            if (!addressCityRegex.test(address.billing.city)) return res.status(400).send({ status: false, message: "provide a Billing City Name" })

            if (!pincodeRegex.test(address.billing.pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })
        }


        //<==========Updating document==============>

        let update = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })

        res.status(200).send({ status: true, msg: "successfully updated", data: update })
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createUser, loginUser, getUser, updateProfile }