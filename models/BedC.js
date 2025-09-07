const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SensorReadingSchema = new mongoose.Schema({
  sensor_id: { type: Number, required: true },
  location: {type: String, require: true},
  temperature: { type: Number, default: null },
  pressure: { type: Number, default: null },
  thresholdStartTime: {type: Date,   default: null},
  
}, { _id: false });

const bedSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    macAddress: { type: String, required: true, unique: true },  // ✅ Unique ESP32 Identifier
    assigned: { type: Boolean, default: false },
    // lastPressure: { type: Number },
    // lastTemperature: { type: Number },
    sensorReadings: [SensorReadingSchema], 
    // caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'user'}
    caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
})

const Bed = mongoose.model('bed', bedSchema)
module.exports = Bed;