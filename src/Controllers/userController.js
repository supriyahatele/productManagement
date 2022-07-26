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
let addressStreetRegex = /^[a-zA-Z0-9 ]/
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
        
        //validate fname
        if (!keyValid(fname) || !NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Please enter fname" })
        if (!NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Invalid fname" })
        //validate lname
        if (!keyValid(lname) || !NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Please enter lname" })
        if (!NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Invalid lname" })

        //validate email
        if (!keyValid(email)) return res.status(400).send({ status: false, message: "Please enter EmailId" })
        if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
        const findEmail = await userModel.findOne({ email: email })
        if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })

        //validate phone
        if (!phone) return res.status(400).send({ status: false, message: "Phone number is required" })
        if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Phone Number! enter a valid Indian mobile umber" })
        const existingMobile = await userModel.findOne({ phone: phone })
        if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number already exists" })

        //validate password
        if (!password) return res.status(400).send({ status: false, message: "Password is required" })
        if (!passwordRegex.test(password)) return res.status(400).send({ status: false, message: "Invalid password!! Enter a password of 8-15 characters" })

        //validate address
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


        if (!address.billing) return res.status(400).send({ status: false, message: "Please enter Billing address and it should be in object!!" })

        let { street, city, pincode } = address.billing;

        if (!keyValid(street)) return res.status(400).send({ status: false, message: "Please Enter Billing street Name" })

        if (!addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })

        if (!keyValid(city)) return res.status(400).send({ status: false, message: "Please enter Billing City Name" })
        if (!addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a Billing City Name" })


        if (!keyValid(pincode)) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
        if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })


        //Since all validations done, proceed to creating user document
        let uploadedFileURL = await uploadFile(files[0])
        data.profileImage = uploadedFileURL

        //encrypt password
        let salt = await bcrypt.genSalt(10)
        let encryptedPassword = await bcrypt.hash(password, salt)
        //console.log(encryptedPassword)

        let data1 = {
            fname: fname.trim(),
            lname: lname.trim(),
            email: email.trim(),
            profileImage: uploadedFileURL,
            phone: phone.trim(),
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
        let user = await userModel.findOne({ email: userName})
        if (!user) {
            return res.status(404).send({ status: false, msg: "Email id not found" })
        }

        const matchPassword = await bcrypt.compare(password,user.password);

        if(!matchPassword) return res.status(401).send({status:false, message:"Invalid password" });


        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "radon",
                organization: "FunctionUp",
            },
            "functionup-radon-secretKey"
        );

        // res.setHeader("x-api-key", token);
        //res.status(200).send({ status: true, token: token })

        return res.status(200).send({ status: true, message: "User login successfull", data: {userid: user._id,token: token }});


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


        //<=========Authorization===========>

        //check if the logged-in user is requesting to modify their own resources 
        if (userId != req.decodedtoken.userId)
            return res.status(403).send({ status: false, msg: 'Author loggedin is not allowed to modify the requested book data' })
        
        //    console.log("Successfully Authorized")


        //<=====Validating fields to update======>
        let { fname, lname, email, address, password, phone } = data
        if (keyValid(fname)) {
            if (typeof fname !== 'string' || !NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Please enter valid fname" })
        }
        if (lname) {
            if ( typeof fname !== 'string' || !NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Please enter valid lname" })
        }
        if (email) {
            if (typeof email !== 'string') return res.status(400).send({ status: false, message: "EmailId should be in string format" })
            if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
            const findEmail = await userModel.findOne({ email: email })
            if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })
        }

        if (phone) {
            if (typeof phone !== 'string') return res.status(400).send({ status: false, message: "provide phone number in string format" })
            if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Number" })
            const existingMobile = await userModel.findOne({ phone: phone })
            if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number is already exists" })
        }

        if (address) {
            if (!address || Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please enter address and it should be in object!!" })
            //address = (data.address)


            if(address.shipping){
                let { street, city, pincode } = address.shipping;

                if(keyValid(street)){
                    if (typeof street !== 'string' || !addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })
                }
                if(keyValid(city))
                    if (typeof street !== 'string' || !addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })
                if(keyValid(pincode))
                    if (typeof street !== 'string' || !pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid Shipping pincode" })
            }
            if (address.billing) {
                let { street, city, pincode } = address.billing;

                if(keyValid(street)){
                    if (typeof street !== 'string' || !addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })
                }
                if(keyValid(city))
                    if (typeof street !== 'string' || !addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })
                if(keyValid(pincode))
                    if (typeof street !== 'string' || !pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid Shipping pincode" })
        
            }
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