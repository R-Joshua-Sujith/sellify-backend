const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    otp: String,
    otpExpiry: Date,
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    addPhone: { type: String, default: '' },
    address: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    city: { type: String, default: '' },
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
