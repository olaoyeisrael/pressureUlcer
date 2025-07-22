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
            const { macAddress, temperature, pressure } = sensorData;

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
                    lastTemperature: temperature,
                    pressure: pressure    
                });
                console.log(temperature)
                console.log(pressure)

                await bed.save();
                console.log(`✅ New bed assigned: ${bed.name} (MAC: ${macAddress})`);
            }

            console.log(`📡 Received Data from Bed: ${bed.name} | Temp: ${temperature}°C | Pressure: ${pressure}mmHg`);
            temperatureArray.push({temperature});
              if (temperatureArray.length > 10) {
                 temperatureArray.shift(); // Remove oldest entry
              }
              // This where the whole logic will come to 
            // 🚨 Check for High Temperature
            bed.lastTemperature = temperature;
            bed.lastPressure = pressure;
            // bed.lastUpdated = new Date(); // optional field for tracking updates
            await bed.save();

            let alertType = '';
            let alertMsg = '';
            if (temperature >= 50) {
                alertType = 'High Temperature';
                alertMsg = `Temperature exceeded safe limit (${temperature}°C)`;
            } else if (pressure >= 40) {
                alertType = 'High Pressure';
                alertMsg = `Pressure exceeded safe threshold (${pressure})`;
            }


            if (alertType) {
                console.log(alertMsg);

                const newAlert = new Alert({
                    bedId: bed._id,  // ✅ Link alert to this bedId
                    alert_type: alertType,
                    message: alertMsg,
                    macAddress: macAddress,
                    temperature: temperature,
                    status: "Active"
                });

                await newAlert.save();
                console.log("✅ Alert saved to database");

                // 🔥 Publish Alert to ESP32 Handband via MQTT
                mqttClient.publish("smartbed/alerts", JSON.stringify({
                    macAddress: macAddress,
                    message: alertType.toUpperCase().replace(" ", "_")
                }));
            }
        } catch (error) {
            console.error("❌ Error processing MQTT message:", error);
        }
    }
});


}

module.exports = mqttRun;
