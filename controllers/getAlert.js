const Alert = require('../models/Alert');
const Bed = require('../models/BedC');

const getAlertsForCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;

    const beds = await Bed.find({ caregiverId });

    const bedIds = beds.map(bed => bed._id);

    // const alerts = await Alert.find({ caregiverId })
    //   .sort({ timestamp: -1 })
    //   .limit(20);
     const alerts = await Alert.find({ bedId: { $in: bedIds } })
      .sort({ timestamp: -1 })
      .limit(20)  // Optional: limit to the latest 20 alerts
      .populate('bedId');

    res.status(200).json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

module.exports = getAlertsForCaregiver;