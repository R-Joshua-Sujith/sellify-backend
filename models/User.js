const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    otp: String,
    otpExpiry: Date,
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
