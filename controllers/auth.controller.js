const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email.toLowerCase();
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id },'my site secret could be anything', { expiresIn: '1d' });
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '365d' });
    user.refreshToken = refreshToken;
    await user.save();

    
    res.status(201).json({ token, refreshToken,  user: { id: user._id, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { password } = req.body;
  const email = req.body.email.toLowerCase();
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '365d' });
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ token, refreshToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    // Verify the token
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ message: 'Invalid refresh token' });

    // Generate new access token
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Token expired or invalid' });
  }
};