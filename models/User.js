const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: {type: String},
    otpExpiry: {type: Date},
    isVerified: {type: Boolean, default: false},
    refreshToken: {type: String}
})

const User = mongoose.model('user', userSchema)
module.exports = User;