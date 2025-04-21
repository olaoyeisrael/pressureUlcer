const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema({
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", required: true },
    // alert_type: { type: String, enum: ["High Temperature", "High Pressure"], required: true },
    message: { type: String, required: true },
    macAddress: { type: String, required: true },  // ✅ Identify which ESP32 triggered the alert
    status: { type: String, enum: ["Active", "Resolved"], default: "Active" },
    temperature: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
})

const Alert = mongoose.model('alert', alertSchema)
module.exports= Alert;