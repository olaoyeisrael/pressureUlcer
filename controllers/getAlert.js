const Alert = require('../models/Alert');

const getAlertsForCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;

    const alerts = await Alert.find({ caregiverId })
      .sort({ timestamp: -1 })
      .limit(20);

    res.status(200).json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

module.exports = getAlertsForCaregiver;