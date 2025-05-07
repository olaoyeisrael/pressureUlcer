const Bed = require('../models/BedC');
const Alert = require('../models/Alert');
const mqtt = require("mqtt");

const mqttRun = ()=>{

    const mqttClient = mqtt.connect("mqtt://broker.emqx.io");
    mqttClient.on("connect", () => {
    console.log("Connected to MQTT Broker!");
    mqttClient.subscribe("smartbed/sensorinput");
    });
    let temperatureArray = [2];
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
                    lastTemperature: temperature    
                });
                console.log(temperature)

                await bed.save();
                console.log(`✅ New bed assigned: ${bed.name} (MAC: ${macAddress})`);
            }

            console.log(`📡 Received Data from Bed: ${bed.name} | Temp: ${temperature}°C`);
            temperatureArray.push({temperature});
              if (temperatureArray.length > 10) {
                 temperatureArray.shift(); // Remove oldest entry
              }
              // This where the whole logic will come to 
            // 🚨 Check for High Temperature
            bed.lastTemperature = temperature;
            // bed.lastUpdated = new Date(); // optional field for tracking updates
            await bed.save();

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


}

module.exports = mqttRun;
