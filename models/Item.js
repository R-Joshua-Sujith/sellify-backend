const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    city: String,
    country: String
});

const ItemSchema = new mongoose.Schema({
    name: String,
    age: Number,
    address: AddressSchema
});

const ItemModel = mongoose.model('Item', ItemSchema);
module.exports = ItemModel;