const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    addPhone: { type: String, default: '' },
    address: { type: String, required: true },
    zipCode: { type: String, required: true },
    city: { type: String, required: true },
    scheduledPickup: {
        pickupDate: { type: Date, required: true },
        pickupTime: { type: String, required: true },
    },
    productDetails: {
        productName: { type: String, required: true },
        price: { type: Number, required: true }
    },
    options: {
        type: mongoose.Schema.Types.Mixed
    }
});

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;
