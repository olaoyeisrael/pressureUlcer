const mongoose = require('mongoose')
const Schema = mongoose.Schema

const bedSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    macAddress: { type: String, required: true, unique: true },  // ✅ Unique ESP32 Identifier
    assigned: { type: Boolean, default: false },
    lastPressure: { type: Number },
    lastTemperature: { type: Number },
    caregiverId: { type: Schema.Types.ObjectId, ref: 'user'}
})

const Bed = mongoose.model('bed', bedSchema)
module.exports = Bed;