const express = require('express')
const app = express()
const mqtt = require("mqtt");
const Bed = require('./models/BedC');
const Alert = require('./models/Alert');
const connectDB = require('./DB/db')
const mqttClient = mqtt.connect("mqtt://broker.emqx.io");
const cors = require('cors');
const protect = require('./middlewares/auth.middleware')
app.use(cors());
let temperatureArray = [2];
app.use(express.json());
connectDB()
mqttClient.on("connect", () => {
    console.log("Connected to MQTT Broker!");
    mqttClient.subscribe("smartbed/sensorinput");
});

// mqttClient.on("message", async (topic, message) => {
//     if (topic === "smartbed/sensorinput") {
//         try {
//             const sensorData = JSON.parse(message.toString());
//             // const { bedId, temperature, pressure } = sensorData;
//             const { macAddress, temperature } = sensorData;
//             const pressure = 0;
//             let bed = await Bed.findOne({ macAddress });

//             // ✅ If No Bed Exists, Assign a New One
//             if (!bed) {
//                 console.log(`🔄 New ESP32 Detected! Assigning a bed to MAC: ${macAddress}`);

//                 // ✅ Create a new bed and assign this MAC address
//                 bed = new Bed({
//                     name: `Bed_${macAddress.substring(macAddress.length - 4)}`,  // e.g., "Bed_5678"
//                     macAddress: macAddress,
//                     assigned: true
//                 });

//                 await bed.save();
//                 console.log(`✅ New bed assigned: ${bed.name} (MAC: ${macAddress})`);

//                 console.log(`📡 Received Data from Bed: ${bed.name} | Temp: ${temperature}°C`);

//              // ✅ Store Temperature Data (Keep Last 10 Readings)
//              temperatureArray.push({ temperature});
//              if (temperatureArray.length > 10) {
//                  temperatureArray.shift(); // Remove oldest entry
//              }

//             // Store Temperature Data in Array
//             if (temperature >= 50|| pressure >= 35) {
//                 // const existingAlert = await Alert.findOne({ bedId, status: "Active" });
//                 const existingAlert = await Alert.findOne({bedId, status: "Active"})
//                 if (!existingAlert) {
//                     console.log("⚠️ High temperature/pressure detected! Saving alert...");
//                     const newAlert = new Alert({
//                         bedId: bed._id,
//                         // alert_type: temperature > 38.0 ? "High Temperature" : "High Pressure",
//                         // message: `Temperature: ${temperature}°C, Pressure: ${pressure} mmHg`,
//                         message: `Temperature: ${temperature}°C`,
//                         status: "Active"
//                     });

//                     await newAlert.save();
//                     console.log("✅ Alert saved to database");

//                     // 🔥 Publish Alert to MQTT for Wearable ESP32
//                     mqttClient.publish("smartbed/alerts", JSON.stringify({
//                         // bedId,
//                         alert_type: newAlert.alert_type,
//                         message: newAlert.message
//                     }));
//                 } else {
//                     console.log("🔄 Alert already exists, skipping duplicate.");
//                 }}

//         } catch (error) {
//             console.error("❌ Error processing MQTT message:", error);
//         }
//     }
// });
mqttClient.on("message", async (topic, message) => {
    if (topic === "smartbed/sensorinput") {
        try {
            const sensorData = JSON.parse(message.toString());
            const { macAddress, temperature } = sensorData;

            // ✅ Find Bed Linked to This MAC Address
            let bed = await Bed.findOne({ macAddress });

            // ✅ If No Bed Exists, Assign a New One
            if (!bed) {
                console.log(`🔄 New ESP32 Detected! Assigning a bed to MAC: ${macAddress}`);

                // ✅ Create a new bed and assign this MAC address
                bed = new Bed({
                    name: `Bed_${macAddress.substring(macAddress.length - 4)}`,  // e.g., "Bed_5678"
                    macAddress: macAddress,
                    assigned: true,
                });

                await bed.save();
                console.log(`✅ New bed assigned: ${bed.name} (MAC: ${macAddress})`);
            }

            console.log(`📡 Received Data from Bed: ${bed.name} | Temp: ${temperature}°C`);
            temperatureArray.push({ temperature});
              if (temperatureArray.length > 10) {
                 temperatureArray.shift(); // Remove oldest entry
              }

            // 🚨 Check for High Temperature
            if (temperature >= 30) {
                console.log("⚠️ High temperature detected! Saving alert...");

                const newAlert = new Alert({
                    bedId: bed._id,  // ✅ Link alert to this bedId
                    alert_type: "High Temperature",
                    message: `Temperature exceeded`,
                    macAddress: macAddress,
                    temperature: temperature,
                    status: "Active"
                });

                await newAlert.save();
                console.log("✅ Alert saved to database");

                // 🔥 Publish Alert to ESP32 Handband via MQTT
                mqttClient.publish("smartbed/alerts", JSON.stringify({
                    macAddress: macAddress,
                    message: "HIGH_TEMPERATURE"
                }));
            }
        } catch (error) {
            console.error("❌ Error processing MQTT message:", error);
        }
    }
});

app.use('/api/auth', require('./routes/auth.routes'));
app.get('/currTemp', (req, res)=>{
    if (temperatureArray.length === 0) {
        return res.status(404).json({ message: "No temperature data available" });
    }
    res.json({  temperature: temperatureArray[temperatureArray.length -1]
    });
    console.log(temperatureArray)
});

app.get('/',protect,(req, res)=>{
    res.json({
        message: 'Last 10 temperature',
        temperature: temperatureArray
    })   
})

// Save the bed details to the backend
app.post('/create-bed',protect, async (req, res)=>{
    try{
        const {name, macAddress} = req.body;
        const newBed = new Bed({name: name, macAddress: macAddress, assigned: false});
        await newBed.save();
        res.status(201).json({ bedId: newBed._id  });
    }
    catch(err){
       res.status(500).json({message: 'Error saving bed'})
    }
})


// save the alert to the db
app.post('/save-alert', (req,res)=>{
    // const alert = Alert.create({sensorData.temperature})

})

// Display alert to dashboard
app.get('/get-alerts/:bedId', async (req, res)=>{
    const {bedId} = req.params;
    try {
        const alerts = await Alert.find({ bedId: bedId});
        // const alerts = await Alert.find({ status: 'Active' });
        res.json(alerts);
    } catch (error) {
        console.error("❌ Error fetching alerts:", error.message);
        res.status(500).json({ message: "Failed to fetch alerts", error: error.message });
    }

})

app.get('/beds/:bedId', async(req, res)=>{
    const { bedId } = req.params;
    try{
        const bed = await Bed.findById(bedId);
        res.status(200).json(bed);
    } catch(error){
        res.status(500).json({error: error.message});
    }
})
app.get('/get-bedid', async(req, res)=>{
    try {
        const bed = await Bed.findOne({ assigned: true }); 
        if (!bed) {
            return res.status(404).json({ message: "No unassigned beds available" });
        }
        // bed.assigned = true;
        // await bed.save();

        res.json({ bedId: bed._id });
    } catch (error) {
        res.status(500).json({ message: "Error fetching bedId", error: error.message });
    }

})

app.get('/get-beds', async(req, res)=>{
    try {
        const beds = await Bed.find();
        res.json(beds);
    } catch (error) {
        console.error("❌ Error fetching beds:", error.message);
        res.status(500).json({ message: "Failed to fetch beds", error: error.message });
    }
    
})
app.post('/acknowledge-alert', async (req, res) => {
    const { alertId } = req.body;

    try {
        const alert = await Alert.findById(alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.status = 'Resolved';  // Update status to acknowledged
        await alert.save();

        res.json({ message: 'Alert acknowledged successfully' });
    } catch (error) {
        console.error("❌ Error acknowledging alert:", error.message);
        res.status(500).json({ message: 'Failed to acknowledge alert', error: error.message });
    }
});



app.listen(4000, ()=>{
    console.log('App listening on port 4000')
})