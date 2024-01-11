const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderID: { type: String, required: true },
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
    },
    status: {
        type: String,
        required: true,
        default: 'new'
    },
    modeofpayment: {
        type: String, required: false
    },
    upiID: {
        type: String, required: false
    },
    promoName: { type: String, required: false, default: "Not Applicable" },
    promoPrice: { type: String, required: false, default: 0 },
    imeiNumber: { type: String, required: false },
    finalPrice: { type: String, required: false },
    deviceBill: { type: Buffer, required: false }, // Change to Buffer type
    idCard: { type: Buffer, required: false }, // Change to Buffer type
    deviceImage: { type: Buffer, required: false }, // Change to Buffer type
    cancellationReason: { type: String },
}, {
    timestamps: true, // Add this line to enable timestamps
}
);

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;
