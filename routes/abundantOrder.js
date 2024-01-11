const router = require("express").Router();
const AbundantOrderModel = require("../models/AbundantOrder");


router.post("/create-abundant-order", async (req, res) => {
    try {
        const {
            phone,
            city,
            productDetails,
            options
        } = req.body;
        const newOrder = new AbundantOrderModel({
            phone,
            city,
            productDetails,
            options
        });
        const savedOrder = await newOrder.save();
        res.status(201).json({ message: "Order Created Successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
        console.log(error)
    }
})

router.get('/get-all-orders', async (req, res) => {
    try {
        const { page = 1, pageSize = 5, search = '', startDate, endDate } = req.query;
        const skip = (page - 1) * pageSize;

        const query = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const allOrders = await AbundantOrderModel.find(query)
            .select('phone city productDetails.productName productDetails.price status createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const totalOrders = await AbundantOrderModel.countDocuments(query);

        res.json({
            totalRows: totalOrders,
            data: allOrders,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/single-orders/:id', async (req, res) => {
    const orderId = req.params.id;

    try {
        const order = await AbundantOrderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error)
    }
});




module.exports = router;