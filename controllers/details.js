const Bed = require('../models/BedC');
const Alert = require('../models/Alert');
const User = require('../models/User');

const getBedDetails = async (req, res) => {
  try {
    const { macAddress } = req.params;

    const bed = await Bed.findOne({ macAddress })
      .populate('caregiverId', 'name email')
      .lean();

    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }

    const recentAlerts = await Alert.find({ macAddress })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      bed,
      recentAlerts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bed details' });
  }
};

module.exports = getBedDetails;