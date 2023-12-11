const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    category_type: { type: String, unique: true },
    attributes: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    sections: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }
})

const CategoryModel = mongoose.model('Category', CategorySchema);

module.exports = CategoryModel;