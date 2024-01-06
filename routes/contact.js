const router = require("express").Router();
const ContactModel = require("../models/Contact");

router.post('/create', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Create a new contact instance
        const newContact = new ContactModel({
            name,
            email,
            phone,
            message,
        });

        // Save the contact to the database
        const savedContact = await newContact.save();

        res.status(201).json(savedContact);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;