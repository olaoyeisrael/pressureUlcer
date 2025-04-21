const mongoose = require('mongoose')

const bedSchema = new mongoose.Schema({
    name: { type: String, required: true },
    macAddress: { type: String, required: true, unique: true },  // ✅ Unique ESP32 Identifier
    assigned: { type: Boolean, default: false },
   
})

const Bed = mongoose.model('bed', bedSchema)
module.exports = Bed;