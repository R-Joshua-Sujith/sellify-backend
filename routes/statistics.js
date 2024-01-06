const router = require("express").Router();

const CategoryModel = require("../models/Category");
const BrandModel = require("../models/Brands");
const ProductModel = require("../models/Product")
const UserModel = require("../models/User")
const OrderModel = require("../models/Order")

router.get("/documentCounts", async (req, res) => {
    try {
        const categoryCount = await CategoryModel.countDocuments();
        const brandCount = await BrandModel.countDocuments();
        const productCount = await ProductModel.countDocuments();
        const orderCount = await OrderModel.countDocuments();
        const userCount = await UserModel.countDocuments();

        const counts = {
            category: categoryCount,
            brand: brandCount,
            product: productCount,
            order: orderCount,
            user: userCount
        };
        res.json(counts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

module.exports = router;