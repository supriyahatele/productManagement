const productModel = require("../model/productModel")
const { uploadFile } = require("./aws");

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


let priceRegex = /[(0-9)+.?(0-9)*]+/
let styleRegex = /^[a-zA-Z]+/
let currency = ['INR']
let sizes = ["S", "XS","M","X", "L","XXL", "XL"]
//let currencyRegex = /^[$]$/


const createProduct = async function (req, res) {
    try {
        let data = req.body
        let files = req.files

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "request Body cant be empty" });
        }

        if (!files || files.length == 0) return res.status(400).send({ status: false, message: "Please provide product image file!!" })

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments} = data
        
        //validate title
        if (!keyValid(title)) return res.status(400).send({ status: false, message: "Please enter title" })
        //title = title.trim()
        data.description = data.description.trim().split(" ").filter(word => word).join(" ");
        const findTitle = await productModel.findOne({ title: title })
        if (findTitle) return res.status(400).send({ status: false, msg: "Title Already exist!!!" })

        if (!keyValid(description)) return res.status(400).send({ status: false, message: "Please enter description" })
        data.description = data.description.trim().split(" ").filter(word => word).join(" ");

        if (!keyValid(price) || !priceRegex.test(price.trim())) return res.status(400).send({ status: false, message: "Please enter a valid price" })
        price = price.trim()

        if (!keyValid(currencyId) || !currency.includes(currencyId.trim())) return res.status(400).send({ status: false, message: "Please enter a valid currencyId" })
        currencyId = currencyId.trim()

        // if (!keyValid(currencyFormat) || currencyFormat.trim() != '₹') return res.status(400).send({ status: false, message: "Please enter a valid currencyFormat" })
        // currencyFormat = currencyFormat.trim()

        if(isFreeShipping)
            if (!keyValid(isFreeShipping) || !(isFreeShipping == "true" || isFreeShipping == "false")) 
            return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping field" })
        
        //if(!availableSizes)
        let sizeList = availableSizes.split(",").map(x=> x.trim());
        
        if(Array.isArray(sizeList)){ 
            for(let i = 0; i < sizeList.length; i++){
                if (!sizes.includes(sizeList[i])) 
                    return res.status(400).send({ status: false, message: "Please Enter valid availableSizes, it should include only " })
            }
        }

        //|| /^[0-9]*/.test(installments)
        if(installments)
            if (!keyValid(installments) ) return res.status(400).send({ status: false, message: "Please enter a valid value for installments" })        

        //Since all validations done, proceed to creating product document
        let uploadedFileURL = await uploadFile(files[0])
        data.productImage = uploadedFileURL

        let data1 = { 
            title: title, 
            description: description, 
            price: price, 
            currencyId: currencyId, 
            //currencyFormat: currencyFormat, 
            isFreeShipping: isFreeShipping, 
            availableSizes: sizeList, 
            installments: installments
        }

        if(style)
            if (!keyValid(style) || !styleRegex.test(style)) return res.status(400).send({ status: false, message: "Please enter a valid style" })

        data1.style = style;

        const newProduct = await productModel.create(data1)
        return res.status(201).send({ status: true, data: newProduct })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

const getProducts = async function (req, res) {
    try {
        const requestQuery = req.query
        const filterQuery = { isDeleted: false }

        if (Object.keys(requestQuery).length > 0){
            const { size, name, priceGreaterThan, priceLessThan, priceSort } = requestQuery
            if (size) {
                let size1 = size.split(",").map(x => x.trim().toUpperCase())
                if (size1.map(x => isValidSize(x)).filter(x => x === false).length !== 0) return res.status(400).send({ status: false, message: "Size Should be among  S,XS,M,X,L,XXL,XL" })
                filterQuery.availableSizes = { $in: size1 }
            }

            if (name) {
                let findTitle = await productModel.find({title: name})
            
                if (fTitle.length == 0) { filterQuery.title = name }
                filterQuery.title = { $in: fTitle }
            }

            if (priceGreaterThan && priceLessThan) { filterQuery.price = { $gt: priceGreaterThan, $lt: priceLessThan } }
            if (priceGreaterThan && !priceLessThan) { filterQuery.price = { $gt: priceGreaterThan } }
            if (priceLessThan && !priceGreaterThan) { filterQuery.price = { $lt: priceLessThan } }

            if (priceSort){
                if(priceSort != 1 && priceSort != -1 ) return res.status(400).send({ status: false, message: "priceSort should be either 1 or -1." })
            }
        }

        const findProducts = await productModel.find(filterQuery).sort({ price: priceSort })

        if (findProducts.length == 0) return res.status(404).send({ status: false, message: "products not found or may be deleted" })

        return res.status(200).send({ status: true, message: "products list", data: findProducts })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}


const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId
        productId = productId.trim()
        if (!productId) return res.status(400).send({ status: false, msg: "plz provide productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: " enter a valid productId " });

        let findProduct = await productModel.findById({ _id: productId })
        if (!findProduct) return res.status(404).send({ status: false, message: " product not found" })

        return res.status(200).send({ status: true, message: " product", data: findProduct })


    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }

}


const updateProduct = async function (req, res){
    try{
        let productId = req.params.productId
        let data = req.body

        if (Object.keys(data).length == 0) { 
            return res.status(400).send({ status: false, msg: "Please enter details in the request Body " }) }

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "Productid is not correct" })
            const checkProduct = await productModel.findById(productId)
            if (!checkProduct) return res.status(404).send({ status: false, msg: "Product is not found" })


    //Validation for updates
    let { title, description, price, currencyId, currencyFormat,productImage, style,availableSizes,} = data
    if (title) {
        if (!keyValid(title)) 
        return res.status(400).send({ status: false, message: "Please enter title in string" })
    }
    const findTitle = await bookModel.findOne({ title: title })
        if (findTitle) {
            return res.status(400).send({ status: false, message: "Title is already exists" })
        }

    if (description) {
        if (!keyValid(description)) 
        return res.status(400).send({ status: false, message: "Please enter  description in string" })
    }
    if (!/^(.|\s)[a-zA-Z]+(.|\s)$/.test(description)) {
        return res.status(400).send({ status: false, message: " please enter description in letters" })
    }
    if (price) {
    if (!keyValid(price)) 
         return res.status(400).send({ status: false, message: "Please enter valid price" })
    }
    if (!/^(\-?\d+\.?\d{0,2})/.test(price)) {
        return res.status(400).send({ status: false, message: " please enter price in Number" })
    }
    if (currencyId) {
        if (!keyValid(currencyId)) 
        return res.status(400).send({ status: false, message: "Please enter currencyId in string" })
    }
    if (!/^\$?[0-9][0-9,]*[0-9]\.?[0-9]{0,2}$/i.test(currencyId)) {
        return res.status(400).send({ status: false, message: " please enter currencyId in Number" })
    }
    if (currencyFormat) {
        if (!keyValid(currencyFormat)) 
        return res.status(400).send({ status: false, message: "Please enter currencyFormat in string " })
    }
    if (!/^\$?[0-9][0-9,]*[0-9]\.?[0-9]{0,2}$/i.test(currencyFormat)) {
        return res.status(400).send({ status: false, message: " please enter valid currencyFormat" })
    }
    if (productImage) {
    if (!keyValid(productImage)) 
        return res.status(400).send({ status: false, message: "Please enter productImage" })
    }
    if (style) {
        if (!keyValid(style)) 
        return res.status(400).send({ status: false, message: "Please enter style in string " })
    }
    if (!/^\$?[0-9][0-9,]*[0-9]\.?[0-9]{0,2}$/i.test(style)) {
        return res.status(400).send({ status: false, message: " please enter valid style" })
    }
    if (availableSizes) {
        if (!keyValid(availableSizes)) 
        return res.status(400).send({ status: false, message: "Please enter availableSizes in string " })
    }
    if (!["S", "XS","M","X", "L","XXL", "XL"].includes(availableSizes)) {
        return res.status(400).send({ status: false, message: "Please Enter  availableSizes between S, XS,M,X, L,XXL, XL " })
    }
    
    let update = await productModel.findOneAndUpdate({ _id: productId },{ title: data.title, description: data.description, price: data.price, currencyId: data.currencyId,currencyFormat: data.currencyFormat,productImage: data.productImage,style: data.style,availableSizes: data.availableSizes, }, { new: true })

    res.status(200).send({ status: true, msg: "successfully updated", data: update })

    }catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        productId = productId.trim()
        if (!productId) return res.status(400).send({ status: false, msg: "plz provide productId" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: " enter a valid productId " });

        let findProduct = await productModel.findById({ _id: productId })
        if (!findProduct) return res.status(404).send({ status: false, message: " product not found" })

        if (findProduct.isDeleted === true) return res.status(404).send({ status: false, message: " already deleted" })

        let DeleteProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: Date.now() } }, { new: true })
        res.status(200).send({ status: true, message: "deleted", data: DeleteProduct })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }

}




module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct}







// const loginUser = async function (req, res) {
//     try {
//         let requestBody = req.body

//         if (!isValidRequestBody(requestBody)) {
//             return res.status(400).send({ status: false, message: "requestBody cant be empty" });
//         }

//         let userName = requestBody.email;
//         let password = requestBody.password;

//         //Email validation
//         if (!keyValid(userName)) {
//             return res.status(400).send({ status: false, msg: "email is required" })
//         }
//         if (!(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/).test(userName)) {
//             return res.status(400).send({ status: false, message: "Please provide valid Email Id" });
//         }

//         //Paeeword validation
//         if (!keyValid(password)) {
//             return res.status(400).send({ status: false, msg: "password is required" })
//         }

//         //User Present or Not
//         let user = await userModel.findOne({ email: userName })
//         if (!user) {
//             return res.status(404).send({ status: false, msg: "Email id not found" })
//         }

//         const matchPassword = await bcrypt.compare(password, user.password);

//         if (!matchPassword) return res.status(401).send({ status: false, message: "Invalid password" });


//         let token = jwt.sign(
//             {
//                 userId: user._id.toString(),
//                 batch: "radon",
//                 organization: "FunctionUp",
//                 exp: "24h"
//             },
//             "functionup-radon-secretKey"
//         );

//         // res.setHeader("x-api-key", token);
//         //res.status(200).send({ status: true, token: token })

//         return res.status(200).send({ status: true, message: "User login successfull", data: { userid: user._id, token: token } });


//     }
//     catch (err) {
//         return res.status(500).send(err.message);

//     }
// }

// const getUser = async function (req, res) {
//     try {
//         const userId = req.params.userId;

//         //<-----------------validating userId----------------------->

//         //if userId is present
//         // if(!userId){
//         //     return res.status(400).send({ status: false, message: " Please provide a userId" });
//         // }

//         if (!isValidObjectId(userId)) {
//             return res.status(400).send({ status: false, message: " enter a valid userId" });
//         }

//         //<---------------finding book with bookid----------------->
//         const details = await userModel.findOne({ _id: userId });

//         //console.log({...details});//<----check destructered output of moongodb call----->

//         if (!details) {
//             return res.status(404).send({ status: false, message: "Requested user not found!!!" });
//         }

//         res.status(200).send({ status: true, message: 'User profile details', data: details })
//     } catch (err) {
//         res.status(500).send({ status: false, message: err.message });
//     }
// }

// const updateProfile = async function (req, res) {
//     try {
//         let userId = req.params.userId
//         let data = req.body
//         if (Object.keys(data).length == 0) { return res.status(400).send({ status: false, msg: "Please enter details in the request Body " }) }

//         if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "not a correct id" })
//         const checkUser = await userModel.findById(userId)
//         if (!checkUser) return res.status(404).send({ status: false, msg: "user not found" })


//         //<=========Authorization===========>

//         //check if the logged-in user is requesting to modify their own resources 
//         if (userId != req.decodedtoken.userId)
//             return res.status(403).send({ status: false, msg: 'User unauthorized!! loggedin is not allowed to modify the requested user data' })

//         console.log("Successfully Authorized")



//         //<=====Validating fields to update======>
//         let { fname, lname, email, address, password, phone } = data

//         if (keyValid(fname)) {
//             if (typeof fname !== 'string') return res.status(400).send({ status: false, message: "fname should be of type string" })
//             fname = fname.trim()
//             if (!NameRegex.test(fname)) return res.status(400).send({ status: false, message: "Please enter valid fname" })
//         }

//         if (keyValid(lname)) {
//             if (typeof lname !== 'string') return res.status(400).send({ status: false, message: "lname should be of type string" })
//             lname = lname.trim()
//             if (!NameRegex.test(lname)) return res.status(400).send({ status: false, message: "Please enter valid last name" })
//         }
//         if (keyValid(email)) {
//             if (typeof email !== 'string') return res.status(400).send({ status: false, message: "EmailId should be in string format" })
//             email = email.trim()
//             if (!emailRegex.test(email)) return res.status(400).send({ status: false, message: "Invalid email" })
//             const findEmail = await userModel.findOne({ email: email })
//             if (findEmail) return res.status(400).send({ status: false, msg: "Email Already exist!!!" })
//         }

//         if (phone) {
//             if (typeof phone !== 'string') return res.status(400).send({ status: false, message: "provide phone number in string format" })
//             phone = phone.trim()
//             if (!phoneRegex.test(phone)) return res.status(400).send({ status: false, message: "Invalid Number" })
//             const existingMobile = await userModel.findOne({ phone: phone })
//             if (existingMobile) return res.status(400).send({ status: false, message: "Mobile number is already exists" })
//         }


//         if (address) {
//             if (Object.keys(address).length == 0) return res.status(400).send({ status: false, message: "Don't enter empty address!!" })
//             //address = (data.address)


//             if (address.shipping) {
//                 let { street, city, pincode } = address.shipping;

//                 if (keyValid(street)) {
//                     street = street.trim()
//                     if (typeof street !== 'string' || !addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })
//                 }
//                 if (keyValid(city)) {
//                     city = city.trim()
//                     if (typeof city !== 'string' || !addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })
//                 }
//                 if (keyValid(pincode)) {

//                     if (typeof pincode !== 'number' || !pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid Shipping pincode" })
//                 }
//             }
//             if (address.billing) {
//                 let { street, city, pincode } = address.billing;

//                 if (keyValid(street)) {
//                     street = street.trim()
//                     if (typeof street !== 'string' || !addressStreetRegex.test(street)) return res.status(400).send({ status: false, message: "provide a valid Shipping Street Name" })
//                 }
//                 if (keyValid(city)) {
//                     city = city.trim()
//                     if (typeof city !== 'string' || !addressCityRegex.test(city)) return res.status(400).send({ status: false, message: "provide a valid Shipping City Name" })
//                 }
//                 if (keyValid(pincode)) {

//                     if (typeof street !== 'number' || !pincodeRegex.test(pincode)) return res.status(400).send({ status: false, message: "provide a valid Shipping pincode" })
//                 }
//             }
//         }


//         //<==========Updating document==============>

//         let update = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })

//         res.status(200).send({ status: true, msg: "successfully updated", data: update })
//     } catch (err) {
//         console.log(err)
//         res.status(500).send({ status: false, message: err.message })
//     }
// }



// loginUser, getUser, updateProfile }