const productModel = require("../model/productModel")
const { uploadFile } = require("./aws");

const mongoose = require('mongoose');

const keyValid = (key) => {
    if (typeof key === 'undefined' || key === 'null') return false
    if (typeof key === 'string' && key.trim().length == 0) return false
    return true
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
}


let priceRegex = /^[(0-9)+.?(0-9)*]+$/
let styleRegex = /^[a-zA-Z _-]+$/
let currency = ['INR', 'USD']
let titleRegex = /^[a-zA-Z][a-zA-Z0-9 $!-_#@%&\.]+$/
//let sizes = ["S", "XS", "M", "X", "L", "XXL", "XL"]


// <================================================= POST /products ===============================================================>

const createProduct = async function (req, res) {
    try {
        let data = req.body
        let files = req.files

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "request Body cant be empty" });
        }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = data

        //validate title
        if (!title.trim()) return res.status(400).send({ status: false, message: "Please enter title" })
        title = title.trim().split(" ").filter(word => word).join(" ");
        if(!titleRegex.test(title)) return res.status(400).send({ status: false, message: "Enter a proper title" })
        
        //console.log(title)

        const findTitle = await productModel.findOne({ title: title })
        if (findTitle) return res.status(400).send({ status: false, msg: "Title Already exist!!!" })
        
        if (!description) return res.status(400).send({ status: false, message: "Please enter description" })
        description = description.trim().split(" ").filter(word => word).join(" ");

        if (!price) return res.status(400).send({ status: false, message: "Please enter price" })
        price = price.trim()
        if(!priceRegex.test(price)) return res.status(400).send({ status: false, message: "Invalid price" })

        if (!currencyId) return res.status(400).send({ status: false, message: "Please enter currencyId" })
        currencyId = currencyId.trim().toUpperCase()
        if(!currency.includes(currencyId)) return res.status(400).send({ status: false, message: "currencyId invalid" })

        if (!files || files.length == 0) return res.status(400).send({ status: false, message: "Please provide product image file!!" })
        //if(productImage) return res.status(400).send({ status: false, message: "invalid format of product image!!" })

        if(!availableSizes) return res.status(400).send({ status: false, message: "available sizes can't be empty" })

        let sizeList = availableSizes.toUpperCase().split(",").map(x => x.trim());
        console.log(sizeList)
        let uniqueSizes = []
    
        if (Array.isArray(sizeList)) {
            for (let i = 0; i < sizeList.length; i++) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeList[i]))
                    return res.status(400).send({ status: false, message: "Please Enter valid sizes, it should include only sizes from  (S,XS,M,X,L,XXL,XL) " })
                if(!uniqueSizes.includes(sizeList[i]))
                    uniqueSizes.push(sizeList[i])
            }
            console.log("Unique Sizes: ", uniqueSizes);
        }


        let uploadedFileURL = await uploadFile(files[0])


        let data1 = {
            title: title,
            description: description,
            price: price,
            currencyId: currencyId,
            productImage: uploadedFileURL, 
            availableSizes: uniqueSizes
        }


        if (style) {
            style = style.trim()
            if (!keyValid(style) || !styleRegex.test(style)) return res.status(400).send({ status: false, message: "Please enter a valid style" })
            data1.style = style;
        }

        if (currencyFormat) {
            currencyFormat = currencyFormat.trim()
            if (currencyFormat != '₹' && currencyFormat != '$') return res.status(400).send({ status: false, message: "Please enter a valid currencyFormat: It should be ₹" })
            if((currencyFormat == '₹' && currencyId != 'INR') || (currencyFormat == '$' && currencyId != 'USD')) return res.status(400).send({ status: false, message: "Invalid currencyFormat and currencyId combination: It should be ₹ for INR, and $ for USD" })
            data1.currencyFormat = currencyFormat;
        }

        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.trim()
            if (!(isFreeShipping == "true" || isFreeShipping == "false"))
                return res.status(400).send({ status: false, message: "Please enter a boolean value for isFreeShipping field" })
            data1.isFreeShipping = isFreeShipping;

        }

        if (installments) {
            installments = installments.trim()
            if (!(/^[0-9]+$/.test(installments))) return res.status(400).send({ status: false, message: "Invalid value for installments" })
            data1.installments = installments
            
        }

        //create document
        const newProduct = await productModel.create(data1)
        return res.status(201).send({ status: true, data: newProduct })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}



// <================================================= GET /products ================================================================>

let getProducts = async (req, res) => {
    try {
        //console.log("get products API")

        let filterProduct = req.query
        //console.log(filterProduct)
        let priceSort = 1

        //base condition
        let filterObject = { isDeleted: false }
        
        //<========Validations of filters========>
        const { size, name, priceGreaterThan, priceLessThan } = filterProduct
        //console.log("destructured:", size, name, priceGreaterThan, priceLessThan)
        

        if (priceGreaterThan) {
            //console.log(priceGreaterThan)
            if (!priceRegex.test(priceGreaterThan)) return res.status(400).send({ status: false, message: 'Invalid format of priceGreaterThan!! ' })
            
            filterObject.price = { $gt: priceGreaterThan }
            console.log(filterObject)    
        }
        if (priceLessThan) {
            if (!priceRegex.test(priceLessThan)) return res.status(400).send({ status: false, message: 'Invalid format of priceLessThan!! ' })
            if (priceGreaterThan) {
                filterObject.price = { $gt: priceGreaterThan, $lt: priceLessThan }
            } else {
                filterObject.price = {
                    $lt: priceLessThan
                }
            }
        }

        if (size) {
            let temp = size.split(',') 
            filterObject.availableSizes = { $in: temp }
        }

        if ('priceSort' in filterProduct) {
            priceSort = filterProduct.priceSort
        }

        //---------[Find product] //
        let data = await productModel.find(filterObject).sort({ price: priceSort })
        console.log(data)
        if (data.length == 0) return res.status(404).send({ status: false, message: 'Requested product not found' });


        if (name) {
            let newData = []
            for (let i of data) {
                if (i.title.includes(name)) {
                    newData.push(i)
                }
            }

            if (newData.length == 0) return res.status(404).send({ status: false, message: 'Product not found' })

            //Finally all filters validations done, now return the filtered products
            return res.status(200).send(
                {
                    status: true,
                    message: 'Product list',
                    data: newData
                })
        }

        return res.status(200).send({status: true, message: 'Product list', data: data})

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// <================================================= GET /products/:productId ======================================================>

const getProductById = async function (req, res) {
    try {
        let productId = req.params.productId
        productId = productId.trim()
        //if (!productId) return res.status(400).send({ status: false, msg: "plz provide productId" })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: " enter a valid productId " });

        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: " product not found" })

        return res.status(200).send({ status: true, message: " product", data: findProduct })


    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }

}

// <================================================= PUT /products/:productId ======================================================>

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        let data = req.body
        let updateObject = {}
        let sizeList = [] 

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, msg: "Request Body cant be empty!! Enter at least one field to update!!" })
        }

        productId = productId.trim()
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "Productid is not valid" })
        const checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) return res.status(404).send({ status: false, msg: "Product is not found" })

        //Validation for updates
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = data

        
        if (title) {
            title = title.trim().split(" ").filter(word => word).join(" ");

            const findTitle = await productModel.findOne({ title: title })
            if (findTitle) {
                return res.status(400).send({ status: false, message: "Title is already exists" })
            }
            updateObject.title = title;
        }

        
        if (description) {
            description = description.trim().split(" ").filter(x => x).join(" ");
            console.log(description)

            updateObject.description = description
        }

        
        if (price) {
            price = price.trim()
            if (!priceRegex.test(price))
                return res.status(400).send({ status: false, message: "Price format invalid" })

            updateObject.price = price;
        }

        
        if (currencyId) {
            currencyId = currencyId.trim().toUpperCase();
            if (currencyId !== 'INR')
                return res.status(400).send({ status: false, message: " Invalid currencyId" })

            updateObject.currencyId = currencyId;
        }

        if (currencyFormat) {
            if (currencyFormat.trim() != '₹') return res.status(400).send({ status: false, message: "Invalid currencyFormat" })
        }

        if (productImage) {
            return res.status(400).send({ status: false, message: "Invalid format of productImage" })
        }

        if (style) {
            style = style.trim()
            if (!styleRegex.test(style)) return res.status(400).send({ status: false, message: "Invalid style" })
            updateObject.style = style
        }

        
        let uniqueSizes = []
        if (availableSizes) {
            //availableSizes = availableSizes.trim()
            sizeList = availableSizes.toUpperCase().split(",").map(x => x.trim());

            if (Array.isArray(sizeList)) {
                for (let i = 0; i < sizeList.length; i++) {
                    if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizeList[i]))
                        return res.status(400).send({ status: false, message: "Invalid size values, should include only sizes from  (S,XS,M,X,L,XXL,XL)" })
                    
                    //avoids duplicate values of sizes
                    if(!(checkProduct.availableSizes.includes(sizeList[i])) && !uniqueSizes.includes(sizeList[i]))
                            uniqueSizes.push(sizeList[i])
                    
                }
            }
        }

        


        
        if (isFreeShipping) {
            isFreeShipping = isFreeShipping.trim()
            if (!(isFreeShipping == "true" || isFreeShipping == "false"))
                return res.status(400).send({ status: false, message: "Please enter a valid boolean value for isFreeShipping field" })
            else {
                updateObject.isFreeShipping = isFreeShipping;
            }
        }

        if (installments) {
            installments = installments.trim()
            if (!(/^[0-9]+$/.test(installments))) return res.status(400).send({ status: false, message: "Please enter a valid value for installments" })
            else {
                updateObject.installments = installments
            }
        }

        let update = await productModel.findOneAndUpdate({ _id: productId }, { $push: { availableSizes: uniqueSizes}, $set: updateObject }, { new: true })

        res.status(200).send({ status: true, msg: "successfully updated", data: update })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

// <================================================= DELETE /products/:productId ===================================================>

const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        productId = productId.trim()
       // if (!productId) return res.status(400).send({ status: false, msg: "plz provide productId" })
        
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


module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct }






