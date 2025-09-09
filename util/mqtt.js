// const Bed = require('../models/BedC');
// const Alert = require('../models/Alert');
// const mqtt = require("mqtt");

// const mqttRun = ()=>{

//     const mqttClient = mqtt.connect("mqtt://broker.emqx.io");
//     mqttClient.on("connect", () => {
//     console.log("Connected to MQTT Broker!");
//     mqttClient.subscribe("smartbed/sensorinput");
//     });
//     let temperatureArray = [2];
//     mqttClient.on("message", async (topic, message) => {
//     if (topic === "smartbed/sensorinput") {
//         try {
//             const sensorData = JSON.parse(message.toString());
//             const { macAddress, temperatures = [], pressures = [] } = sensorData;

//             // Find Bed Linked to This MAC Address
//             let bed = await Bed.findOne({ macAddress });


//             // If No Bed Exists, Assign a New One
//             if (!bed) {
//                 console.log(` New ESP32 Detected! Assigning a bed to MAC: ${macAddress}`);

//                 // Create a new bed and assign this MAC address
//                 bed = new Bed({
//                     name: `Bed_${macAddress.substring(macAddress.length - 4)}`,  // e.g., "Bed_5678"
//                     macAddress: macAddress,
//                     assigned: true,
//                     sensorReadings: []
//                 });

//                 await bed.save();
//                 console.log(`New bed assigned: ${bed.name} (MAC: ${macAddress})`);
//             }

//             console.log(`Received Data from Bed: ${bed.name} | Temp: ${temperatures}°C | Pressure: ${pressures}mmHg`);
//             temperatureArray.push({temperature});
//               if (temperatureArray.length > 10) {
//                  temperatureArray.shift(); // Remove oldest entry
//               }
//               // This where the whole logic will come to 
//             //Check for High Temperature
//             // bed.lastTemperature = temperature;
//             // bed.lastPressure = pressure;
//             // bed.lastUpdated = new Date(); // optional field for tracking updates

//             bed.sensorReadings = temperatures.map((temp, index) => ({
//             sensor_id: index + 1,
//             temperature: temp ?? null,
//             pressure: pressures[index] ?? null
//             }));
//             await bed.save();

//             let alertType = '';
//             let alertMsg = '';
//             if (temperature >= 50) {
//                 alertType = 'High Temperature';
//                 alertMsg = `Temperature exceeded safe limit (${temperature}°C)`;
//             } else if (pressure >= 40) {
//                 alertType = 'High Pressure';
//                 alertMsg = `Pressure exceeded safe threshold (${pressure})`;
//             }


//             if (alertType) {
//                 console.log(alertMsg);

//                 const newAlert = new Alert({
//                     bedId: bed._id,  // Link alert to this bedId
//                     alert_type: alertType,
//                     message: alertMsg,
//                     macAddress: macAddress,
//                     temperature: temperature,
//                     pressure: pressure,
//                     status: "Active"
//                 });

//                 await newAlert.save();
//                 console.log("Alert saved to database");

//                 // Publish Alert to ESP32 Handband via MQTT
//                 mqttClient.publish("smartbed/alerts", JSON.stringify({
//                     macAddress: macAddress,
//                     message: alertType.toUpperCase().replace(" ", "_")
//                 }));
//             }
//         } catch (error) {
//             console.error("Error processing MQTT message:", error);
//         }
//     }
// });


// }

// module.exports = mqttRun;


const Bed = require('../models/BedC');
const Alert = require('../models/Alert');
const mqtt = require("mqtt");
const sensorLocations = [
  "Head",
  "Left Arm",
  "Right Arm",
  "Left Buttock",
  "Right Buttock",
  "Left Heel",
  "Right Heel"
];
const caregiverId = '681b86b7306c61e2bb112b63'

const mqttRun = () => {
  const mqttClient = mqtt.connect("mqtt://broker.emqx.io");

  mqttClient.on("connect", () => {
    console.log("Connected to MQTT Broker!");
    mqttClient.subscribe("smartbed/sensorinput");
  });

  mqttClient.on("message", async (topic, message) => {
    if (topic === "smartbed/sensorinput") {
      try {
        const sensorData = JSON.parse(message.toString());
        const { macAddress, pressures = [], temperatures = [] } = sensorData;
//        const adjustedPressures = pressures.map((p, i) => {
//   if (i < 5) return p - 5;
//   return p - 35;
// });
// const adjustedPressures = pressures.map((p, i) => {
//   let adjusted = i < 5 ? p - 5 : p - 35;
//   return adjusted < 0 ? 0 : adjusted;  // clamp negatives to 0
// });
const adjustedPressures = pressures.map((p, i) => {
  let adjusted = i < 5 ? p - 5 : p - 35;
  adjusted = adjusted < 0 ? 0 : adjusted;
  return Number(adjusted.toFixed(2));  // round to 2 dp
});


        let bed = await Bed.findOne({ macAddress });

        if (!bed) {
          console.log(`New ESP32 Detected! Assigning a bed to MAC: ${macAddress}`);
          bed = new Bed({
            name: `Bed_${macAddress.slice(-4)}`,
            macAddress,
            assigned: true,
            caregiverId: caregiverId,
            sensorReadings: [],
          });
          await bed.save();
          console.log(`New bed assigned: ${bed.name} (MAC: ${macAddress})`);
        }

        console.log(`Received from ${bed.name} | Temps: ${temperatures} | Pressures: ${adjustedPressures}`);

        // Update sensor readings
        // bed.sensorReadings = temperatures.map((temp, index) => ({
        //   sensor_id: index + 1,
        //   location: sensorLocations[index] || `Sensor ${index + 1}`,
        //   temperature: temp ?? null,
        //   pressure: pressures[index] ?? null,
        // }));
        // await bed.save();


        //  await Bed.findOneAndUpdate(
        //   { macAddress },
        //   {
        //     $set: {
        //       sensorReadings: temperatures.map((temp, index) => ({
        //         sensor_id: index + 1,
        //         location: sensorLocations[index] || `Sensor ${index + 1}`,
        //         temperature: temp ?? null,
        //         pressure: pressures[index] ?? null,
        //       }))
        //     }
        //   },
        //   { new: true } // Ensure we return the updated document
        // );
       const now = Date.now();
       const name = `Bed_${macAddress.slice(-4)}`

        // Check each sensor reading for alert conditions
        for (let i = 0; i < temperatures.length; i++) {
          const temp = temperatures[i];
          const pres = adjustedPressures[i];
          let reading = bed.sensorReadings[i] || {};
          const thresholdExceeded = temp >= 40 || pres >= 32;
          // let alertType = '';
          // let alertMsg = '';
          if (thresholdExceeded) {
            if (!reading.thresholdStartTime){
              reading.thresholdStartTime = now;
              console.log(`Sensor ${i + 1}: Threshold breached, timer started`);
            }
            else {
              // Timer already running, check duration
              const elapsed = now - reading.thresholdStartTime;
              if (elapsed >= 2 * 60 * 60 * 1000) { // 2 hours
                const alertType = temp >= 50 ? 'High Temperature' : 'High Pressure';
                const alertMsg =
                  temp >= 50
                    ? `Sensor ${i + 1}: Temperature ${temp}°C exceeded safe limit for over 2 hours`
                    : `Sensor ${i + 1}: Pressure ${pres}mmHg exceeded safe threshold for over 2 hours`;

                console.log(alertMsg);
                const newAlert = new Alert({
                  bedId: bed._id,
                  alert_type: alertType,
                  name: name,
                  message: alertMsg,
                  macAddress,
                  sensorId: i + 1,
                  temperature: temp,
                  pressure: pres,
                  status: "Active"
                });
                await newAlert.save();
    

         

            mqttClient.publish("smartbed/alerts", JSON.stringify({
              macAddress,
              sensorId: i + 1,
              message: alertType.toUpperCase().replace(" ", "_")
            }));
            reading.thresholdStartTime = null
          }
        }
      } else{
        reading.thresholdStartTime = null;
      }
       bed.sensorReadings[i] = {
            ...reading,
            sensor_id: i + 1,
            location: sensorLocations[i] || `Sensor ${i + 1}`,
            temperature: temp ?? null,
            pressure: pres ?? null
          };
        }
        await bed.save();
      }
      catch (error) {
        console.error("Error processing MQTT message:", error);
      }
    }
  });
};

module.exports = mqttRun;


