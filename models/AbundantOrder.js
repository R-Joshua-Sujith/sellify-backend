const mongoose = require('mongoose');
const abundantOrderSchema = new mongoose.Schema({
    email: { type: String, required: true },
    city: {
        type: String
    },
    productDetails: {
        productName: { type: String, required: true },
        price: { type: Number, required: true },
    },
    options: { type: mongoose.Schema.Types.Mixed },
    status: {
        type: String,
        required: true,
        default: 'new'
    }
}, {
    timestamps: true,
})

const AbundantOrderModel = mongoose.model("AbundantOrder", abundantOrderSchema);

module.exports = AbundantOrderModel;