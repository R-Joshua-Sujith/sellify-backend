const router = require("express").Router();
const UserModel = require("../models/User");
const nodemailer = require('nodemailer');

const generateNumericOTP = (length) => {
    const digits = '0123456789';
    let OTP = '';

    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    return OTP;
};

router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    // Find user by email or create a new user
    let user = await UserModel.findOne({ email });

    if (!user) {
        // Create a new user if not found
        user = new UserModel({ email });
    }

    // Generate OTP
    const otp = generateNumericOTP(6); // Adjust the length as needed
    const otpExpiry = Date.now() + 600000; // 10 minutes

    // Save OTP and its expiry to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;

    try {
        await user.save();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to save user' });
    }

    // Send email with OTP
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'joshuasujith14@gmail.com',
            pass: 'ncbbbbtrcqqjuvpc',
        },
    });

    const mailOptions = {
        from: 'joshuasujith14@gmail.com',
        to: email,
        subject: 'OTP Verification',
        text: `You are receiving this email for OTP verification in Sellify. Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: 'Failed to send OTP' });
        }

        res.json({ message: 'OTP Sent' });
    });
});


router.post('/login', async (req, res) => {
    const { otp, email } = req.body;

    // Find user by reset token, OTP, and email
    const user = await UserModel.findOne({
        email,
        otp,
        otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid OTP or email' });
    }

    // Clear OTP and OTP expiry after successful reset
    user.otp = undefined;
    user.otpExpiry = undefined;

    try {
        await user.save();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server Error' });
    }

    res.json({ message: 'Login Successful' });
});

router.post('/api/users/:email', async (req, res) => {
    const { email } = req.params;
    const { firstName, lastName, phone, addPhone, address, zipCode, city } = req.body;

    try {
        // Find the user by email
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            // Update the existing user's information
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.phone = phone;
            existingUser.addPhone = addPhone || '';
            existingUser.address = address;
            existingUser.zipCode = zipCode;
            existingUser.city = city;

            await existingUser.save();
            res.status(200).json({ message: 'User information updated successfully.' });
        } else {
            // Create a new user if not exists
            const newUser = new UserModel({
                email,
                firstName,
                lastName,
                phone,
                addPhone: addPhone || '',
                address,
                zipCode,
                city,
            });

            await newUser.save();
            res.status(201).json({ message: 'User created successfully.' });
        }
    } catch (error) {
        console.error('Error storing user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/api/users-fill/:email', async (req, res) => {
    const { email } = req.params;
    const { firstName, lastName, phone, addPhone, address, zipCode, city } = req.body;

    try {
        // Find the user by email
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            // Update the existing user's information
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.phone = phone;
            existingUser.addPhone = addPhone || '';


            await existingUser.save();
            res.status(200).json({ message: 'User information updated successfully.' });
        } else {
            // Create a new user if not exists
            const newUser = new UserModel({
                email,
                firstName,
                lastName,
                phone,
                addPhone: addPhone || '',

            });

            await newUser.save();
            res.status(201).json({ message: 'User created successfully.' });
        }
    } catch (error) {
        console.error('Error storing user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/api/users/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // Find the user by email
        const user = await UserModel.findOne({ email });

        if (user) {
            const userData = {
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                addPhone: user.addPhone,
                address: user.address,
                zipCode: user.zipCode,
                city: user.city,
                email: user.email
            };

            res.status(200).json(userData);
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/get-all-users', async (req, res) => {
    try {
        const { page = 1, pageSize = 5, search = '' } = req.query;
        const skip = (page - 1) * pageSize;

        const query = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { zipCode: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        const allUsers = await UserModel.find(query)
            .select('email firstName lastName phone addPhone address zipCode city')
            .sort({ createdAt: -1 }) // Assuming you have a createdAt field in your UserSchema
            .skip(skip)
            .limit(parseInt(pageSize));

        const totalUsers = await UserModel.countDocuments(query);

        res.json({
            totalRows: totalUsers,
            data: allUsers,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.get('/get-all-userss', async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search = '' } = req.query;
        const skip = (page - 1) * pageSize;

        const query = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { zipCode: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        const allUsers = await UserModel.find(query)
            .select('email firstName lastName phone addPhone address zipCode city')
            .sort({ createdAt: -1 }) // Assuming you have a createdAt field in your UserSchema
            .skip(skip)
            .limit(parseInt(pageSize));

        const totalUsers = await UserModel.countDocuments(query);
        const headers = ["email", "firstName", "lastName", "phone", "addPhone", "address", "zipCode", "city"];

        res.send({
            headers,
            totalRows: totalUsers,
            data: allUsers,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

router.delete('/delete/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if the user exists
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user
        await UserModel.findByIdAndDelete(userId);

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;