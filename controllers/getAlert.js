// const Alert = require('../models/Alert');
// const Bed = require('../models/BedC');

// const getAlertsForCaregiver = async (req, res) => {
//   try {
//     const { caregiverId } = req.params;

//     const beds = await Bed.find({ caregiverId });

//     const bedIds = beds.map(bed => bed._id);

//     // const alerts = await Alert.find({ caregiverId })
//     //   .sort({ timestamp: -1 })
//     //   .limit(20);
//      const alerts = await Alert.find({ bedId: { $in: bedIds } })
//       .sort({ timestamp: -1 })
//       .limit(20)  // Optional: limit to the latest 20 alerts
//       .populate('bedId');
      

//     res.status(200).json(alerts);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to fetch alerts' });
//   }
// };

// module.exports = getAlertsForCaregiver;


const Alert = require('../models/Alert');
const Bed = require('../models/BedC');

const getAlertsForCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;

    // Find all beds associated with the given caregiverId
    const beds = await Bed.find({caregiverId})  // Populate caregiverId to get full caregiver details


    // If no beds are found for this caregiver, return an appropriate message
    if (beds.length === 0) {
      return res.status(404).json({ message: 'No beds found for this caregiver' });
    }

    // // Extract the bedIds from the found beds
    const bedIds = beds.map(bed => bed._id);

    // // Fetch alerts that belong to these beds, sorted by timestamp and limited to the latest 20
    const alerts = await Alert.find({ bedId: { $in: bedIds } })
      .sort({ timestamp: -1 })
      .limit(20)
       // Populate bedId field with the corresponding Bed data

    // // If no alerts are found for these beds, return an appropriate message
    // if (alerts.length === 0) {
    //   return res.status(404).json({ message: 'No alerts found for these beds' });
    // }

    // Respond with the fetched alerts
    res.status(200).json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

module.exports = getAlertsForCaregiver;