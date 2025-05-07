const Bed = require('../models/BedC');

const getBedsForCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;

    const beds = await Bed.find({ caregiverId }).select('-__v');

    res.status(200).json(beds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch beds.' });
  }
};

module.exports = getBedsForCaregiver;