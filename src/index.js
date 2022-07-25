const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route');
const { AppConfig } = require('aws-sdk');
const multer = require('multer')

const mongoose = require('mongoose');
const app = express();

app.use(bodyParser.json());
app.use( multer().any())

let url = "mongodb+srv://supriyahatele:vE25ShJqu2IFbCtY@cluster0.qldb2.mongodb.net/group67Database"
mongoose.connect(url, {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use('/', route)


app.listen( process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});