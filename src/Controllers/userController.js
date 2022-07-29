const userModel = require("../model/userModel")
const bcrypt = require('bcrypt');
//const aws = require("./aws")
const { uploadFile } = require("./aws");
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');



const keyValid = (key) => {
    if (typeof (key) === 'undefined' || typeof (key) === 'null') return false
    if (typeof (key) === 'string' && key.trim().length === 0) return false
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
let addressStreetRegex = /^[a-zA-Z0-9 -\.]$/
let addressCityRegex = /^[a-zA-Z]+$/
let pincodeRegex = /^[1-9]\d{5}$/
let phoneRegex = /^[6-9]\d{9}$/


// <================================================= POST /register ===============================================================>
const createUser = async function (req, res) {
    try {
        let data = req.body
        let files = req.files

        if (!files || files.length == 0) return res.status(400).send({ status: false, message: "Please enter image file!!" })

        let { fname, lname, email, address, password, phone } = data


        //validate fname
        if (!keyValid(fname)) return res.status(400).send({ status: false, message: "Please enter fname" })
        fname = fname.trim();
        if (!NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Invalid fname" })
        //validate lname
        if (!lname) return res.status(400).send({ status: false, message: "Please enter lname" })
        lname = lname.trim();
        if (!NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Invalid lname" })

        //validate email
        if (!email) return res.status(400).send({ status: false, message: "Please enter EmailId" })
        email = email.trim()
        if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
        const findEmail = await userModel.findOne({ email: email })
        if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })

        //validate phone
        if (!phone) return res.status(400).send({ status: false, message: "Phone number is required" })
        phone = phone.trim()
        if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Phone Number! enter a valid Indian mobile umber" })
        const existingMobile = await userModel.findOne({ phone: phone })
        if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number already exists" })

        //validate password
        if (!password) return res.status(400).send({ status: false, message: "Password is required" })
        password = password.trim()
        if (!passwordRegex.test(password)) return res.status(400).send({ status: false, message: "Invalid password!! Enter a password of 8-15 characters" })


        //validate address
        
        if (!address) return res.status(400).send({ status: false, message: "Enter address" })
                
        try {
            address = JSON.parse(address);
        }
        catch (err) {
            console.log(err)
           return  res.status(400).send({ status: false, message: "Address not in object format or its values are invalid format!!" })
        }

        if (typeof address !== "object") {
            return res.status(400).send({ status: false, message: "address should be in object format" })
        }
        
        if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Please enter a valid address!!" })

        if (!address.shipping) return res.status(400).send({ status: false, message: "Please enter shipping address and it should be in object!!" })
        else {

            let { street, city, pincode } = address.shipping;

            if (!street) return res.status(400).send({ status: false, message: "Enter shipping street" })
            if (!addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })

            if (!keyValid(city)) return res.status(400).send({ status: false, message: "Enter Shipping city" })
            if (!addressCityRegex.test(city.trim())) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })

            if (!pincode) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
            if(typeof pincode === "string") pincode = pincode.trim()
            if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })
        }


        if (!address.billing) return res.status(400).send({ status: false, message: "Please enter Billing address and it should be in object!!" })

        let { street, city, pincode } = address.billing;

        if (!keyValid(street)) return res.status(400).send({ status: false, message: "Please Enter Billing street Name" })

        if (!addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })

        if (!keyValid(city)) return res.status(400).send({ status: false, message: "Please enter Billing City Name" })
        if (!addressCityRegex.test(city.trim())) return res.status(400).send({ status: false, message: "provide a Billing City Name" })


        if (!keyValid(pincode)) return res.status(400).send({ status: false, message: "Enter Shipping Pincode" })
        if(typeof pincode === "string") pincode = pincode.trim()
        if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid pincode" })


        //Since all validations done, proceed to creating user document
        let uploadedFileURL = await uploadFile(files[0])

        //encrypt password
        let salt = await bcrypt.genSalt(10)
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

// <================================================= POST /login ===============================================================>


const loginUser = async function (req, res) {
    try {
        let requestBody = req.body

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "requestBody cant be empty" });
        }

        const {email, password} = requestBody

        //Email validation
        if (!keyValid(email)) {
            return res.status(400).send({ status: false, msg: "email is required" })
        }
        email.trim()
        if (!(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/).test(email)) {
            return res.status(400).send({ status: false, message: "Please provide valid Email Id" });
        }

        //Password validation
        if (!keyValid(password) || typeof password != "string") {
            return res.status(400).send({ status: false, msg: "Provide a valid password!!" })
        }
        password = password.trim()
        if (!passwordRegex.test(password)) return res.status(400).send({ status: false, message: "Invalid password!! Enter a password of 8-15 characters" })

        //User Present or Not
        let user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(404).send({ status: false, msg: "Email id not found" })
        }


        const matchPassword = await bcrypt.compare(password, user.password);

        if (!matchPassword) return res.status(401).send({ status: false, message: "Invalid password" });


        let token = jwt.sign(
            {
                userId: user._id.toString(),
                batch: "radon",
                organization: "FunctionUp",
            },
            "functionup-radon-secretKey",
            {expiresIn:'1m'}
            
        );

        return res.status(200).send({ status: true, message: "User login successfull", data: { userid: user._id, token: token } });


    }
    catch (err) {
        return res.status(500).send(err.message);

    }
}


// <============================================ GET /user/:userId/profile ========================================================>

const getUser = async function (req, res) {
    try {
        const userId = req.params.userId;

        //<-----------------validating userId----------------------->

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: " enter a valid userId" });
        }

        //<---------------finding book with bookid----------------->
        const details = await userModel.findOne({ _id: userId });

        if (!details) {
            return res.status(404).send({ status: false, message: "Requested user not found!!!" });
        }

        res.status(200).send({ status: true, message: 'User profile details', data: details })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}


// <============================================ PUT /user/:userId/profile ========================================================>

const updateProfile = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let files = req.files

        if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, msg: "Please enter details in the request Body " }) }

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "not a correct id" })
        
        const validUser = await userModel.findById(userId)
        if (!validUser) return res.status(404).send({ status: false, msg: "user not found" })

        //<=========Authorization===========>

        //check if the logged-in user is requesting to modify their own profile 
        if (userId != req.decodedtoken.userId)
            return res.status(403).send({ status: false, msg: 'User unauthorized!! loggedin is not allowed to modify the requested user data' })

        console.log("Successfully Authorized")

        //<=====Validating fields to update======>
        let { fname, lname, email, address, password, phone, profileImage } = data

        if (fname) {
            //if (typeof fname !== 'string') return res.status(400).send({ status: false, message: "fname should be of type string" })
            fname = fname.trim()
            if (!NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Please enter valid fname" })
            validUser.fname = fname 
        }

        if (lname) {
            //if (typeof lname !== 'string') return res.status(400).send({ status: false, message: "lname should be of type string" })
            lname = lname.trim()
            if (!NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Please enter valid last name" })
            validUser.lname = lname 
        }
        if (email) {
            //if (typeof email !== 'string') return res.status(400).send({ status: false, message: "EmailId should be in string format" })
            email = email.trim()
            if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
            const findEmail = await userModel.findOne({ email: email })
            if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })
            validUser.email = email
        }

        if (phone) {
            //if (typeof phone !== 'string') return res.status(400).send({ status: false, message: "provide phone number in string format" })
            phone = phone.trim()
            if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Number" })
            const existingMobile = await userModel.findOne({ phone: phone })
            if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number is already exists" })
            validUser.phone = phone
        }

        if(password){
            if (!passwordRegex.test(password)) return res.status(400).send({ status: false, message: "Invalid password!! Enter a password of 8-15 characters" })
            let salt = 10
           let encryptedPassword = await bcrypt.hash(password, salt)
           validUser.password = encryptedPassword
           //console.log(encryptedPassword)
           }

        if(profileImage){
            return res.status(400).send({ status: false, message: "Profileimage format invalid!!" })
        }

        if (address) {
            try {
                address = JSON.parse(address);
                //console.log(address, typeof address)
            }
            catch (err) {
                console.log(err)
               return  res.status(400).send({ status: false, message: "Enter address in object format, check if its values are valid format!!" })
            }
    
            if (typeof address !== "object") {
                return res.status(400).send({ status: false, message: "address should be in object format" })
            }

            if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Don't enter empty address!!" })

            let {shipping, billing} = address;

            if (shipping) {
                let { street, city, pincode } = shipping;

                if (keyValid(street)) {
                    street = street.trim()
                    if (typeof street !== 'string' || !addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })
                    validUser.address.shipping.street = street
                }
                if (keyValid(city)) {
                    city = city.trim()
                    if (typeof city !== 'string' || !addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })
                    validUser.address.shipping.city = city
                }
                if (keyValid(pincode)) {
                    if(typeof pincode === "string") pincode = pincode.trim()
                    if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid Shipping pincode" })
                    validUser.address.shipping.pincode = pincode
                }
            }
            if (billing) {
                let { street, city, pincode } = billing;

                if (keyValid(street)) {
                    street = street.trim()
                    if (typeof street !== 'string' || !addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Billing Street Name" })
                    validUser.address.billing.street = street
                }
                if (keyValid(city)) {
                    city = city.trim()
                    if (typeof city !== 'string' || !addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Billing City Name" })
                    validUser.address.billing.city = city
                }
                if (keyValid(pincode)) {
                    if(typeof pincode === "string") pincode = pincode.trim()
                    if (!pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid Billing pincode" })
                    validUser.address.billing.pincode = pincode
                }
            }
        }

        
        if(files.length > 0){
            let uploadedFileURL = await uploadFile(files[0])
            validUser.profileImage = uploadedFileURL
        }

        //<==========Updating document==============>
        validUser.save();

        res.status(200).send({ status: true, msg: "successfully updated", data: validUser })
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createUser, loginUser, getUser, updateProfile }