const mongose = require("mongoose");


const connectDB = async (url) => {
    return await mongose.connect(url);
}

module.exports = connectDB;