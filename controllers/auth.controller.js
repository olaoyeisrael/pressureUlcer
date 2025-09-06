const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer')
const crypto = require('crypto')


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: 'harduragbemeei@gmail.com',
    pass: process.env.PASS_KEY
  }
})

const generateOtp = () => crypto.randomInt(1000, 10000).toString();

exports.register = async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email.toLowerCase();
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, otp, otpExpiry });

    // const verificationToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '1d' });
    // user.verificationToken = verificationToken;
    await user.save();
    await transporter.sendMail({
      from: 'harduragbemeei@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your otp code is ${otp}`
    })




    // const token = jwt.sign({ id: user._id },'my site secret could be anything', { expiresIn: '1d' });
    // // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    // const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '365d' });
    // user.refreshToken = refreshToken;
    // await user.save();

    
    
    res.status(201).json('Otp sent to the email');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async(req, res) =>{
  try {
    const otp = req.body.otp;
    // const email  = req.body.email;

    // if (!email){
    //   return res.status(400).json({message: 'Email is important'})
    // }
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({email})
    if (!user) {
      return res.status(400).json({message: 'User does not exist'}
      )
    }
    if (user.isVerified) return res.status(400).json({message : 'User already verified'})
    if (user.otp !== otp || user.otpExpiry < new Date() ){
      res.status(400).json({message: 'Invalid Token'})
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save()
    const token = jwt.sign({ id: user._id },'my site secret could be anything', { expiresIn: '15m' });
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET);
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ token, refreshToken, user: { id: user._id, name: user.name, email: user.email } });

    // res.json({message: 'Email verified'})
  }
  catch(error){
    res.status(500).json({message: 'Error Verifying Otp'})
    console.log(error)
  }

}


exports.login = async (req, res) => {
  const { password } = req.body;
  const email = req.body.email.toLowerCase();
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET);
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
    const user = await User.findOne({refreshToken})

    // const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ message: 'Invalid refresh token' });

    // Generate new access token
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Token expired or invalid' });
  }
};