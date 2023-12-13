const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    productImage: { type: String },
    productName: { type: String },
    basePrice: { type: Number },
    variant: { type: String },
    model: { type: String },
    brandName: { type: String },
    seriesName: { type: String },
    categoryType: { type: String },
    dynamicFields: { type: mongoose.Schema.Types.Mixed } // Dynamic fields based on the category
});

const ProductModel = mongoose.model('Product', ProductSchema);

module.exports = ProductModel;
