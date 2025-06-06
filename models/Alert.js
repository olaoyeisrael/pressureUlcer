// const mongoose = require('mongoose')

// const alertSchema = new mongoose.Schema({
//     bedId: { type: mongoose.Schema.Types.ObjectId, ref: "bed", required: true },
//     // alert_type: { type: String, enum: ["High Temperature", "High Pressure"], required: true },
//     message: { type: String, required: true },
//     macAddress: { type: String, required: true },  // ✅ Identify which ESP32 triggered the alert
//     status: { type: String, enum: ["Active", "Resolved"], default: "Active" },
//     temperature: { type: Number, required: true },
//     timestamp: { type: Date, default: Date.now }
// })
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
  macAddress: { type: String, required: true},
  type: {
    type: String, // 'pressure' or 'temperature'
    enum: ['pressure', 'temperature'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  caregiverId: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
});

const Alert = mongoose.model('alert', alertSchema)
module.exports= Alert;