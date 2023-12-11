const mongoose = require('mongoose');



const ProductSchema = new mongoose.Schema({
    productImage: { type: String },
    productName: { type: String, unique: true },
    basePrice: { type: Number, required: true },
    variant: { type: String, required: true },
    model: { type: String, required: true },
    brandName: { type: String },
    seriesName: { type: String },
    categoryType: { type: String },
    attributes: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    sections: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }
});

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
