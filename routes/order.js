const router = require("express").Router();
const OrderModel = require("../models/Order");
const CounterModel = require("../models/Counter")
const AbundantOrderModel = require("../models/AbundantOrder");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function getNextSequenceValue() {
    try {
        const sequenceDocument = await CounterModel.findOneAndUpdate(
            { name: "Counter" },
            { $inc: { sequence_value: 1 } },
            { returnDocument: 'after' }
        );

        if (!sequenceDocument) {
            throw new Error("Counter document not found");
        }

        return sequenceDocument.sequence_value;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to get the next sequence value");
    }
}

// Utility function to generate custom order IDs
async function generateCustomID() {
    try {
        const sequenceValue = await getNextSequenceValue();
        console.log(sequenceValue)
        return `Selligo${sequenceValue}`;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to generate custom ID");
    }
}


router.post('/create-order', async (req, res) => {
    try {
        // Extract order details from the request body
        const {
            firstName,
            lastName,
            email,
            phone,
            addPhone,
            address,
            zipCode,
            city,
            scheduledPickup,
            productDetails,
            options,
            modeofpayment,
            upiID
        } = req.body.updatedOrderDetails;

        const orderID = await generateCustomID();

        // Create a new order instance using the OrderModel
        const newOrder = new OrderModel({
            orderID: orderID,
            firstName,
            lastName,
            email,
            phone,
            addPhone,
            address,
            zipCode,
            city,
            scheduledPickup,
            productDetails,
            options,
            modeofpayment,
            upiID
        });

        // Save the new order to the database
        const savedOrder = await newOrder.save();
        const deletedAbundantOrder = await AbundantOrderModel.deleteMany({
            email,
            'productDetails.productName': productDetails.productName,
        });

        res.status(201).json({ message: 'Order created successfully', order: savedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/api/orders/:orderId/processing', async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update the status
        order.status = 'processing';
        await order.save();

        return res.status(200).json({ message: 'Order status updated to processing' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:orderId/cancel', async (req, res) => {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;

    try {
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update the order status to 'cancel' and store the cancellation reason
        order.status = 'cancelled';
        order.cancellationReason = cancellationReason;

        await order.save();

        return res.status(200).json({ message: 'Order canceled successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/single-orders/:id', async (req, res) => {
    const orderId = req.params.id;

    try {
        const order = await OrderModel.findById(orderId, { deviceBill: 0, idCard: 0, deviceImage: 0 }).exec();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/api/orders/:orderId/complete', upload.fields([
    { name: 'deviceBill', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'deviceImage', maxCount: 1 }
]), async (req, res) => {
    const { orderId } = req.params;
    const { imeiNumber, finalPrice } = req.body;

    try {
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order details
        order.imeiNumber = imeiNumber;
        order.finalPrice = finalPrice;

        // Attach images to order
        if (req.files) {
            order.deviceBill = req.files['deviceBill'][0].buffer;
            order.idCard = req.files['idCard'][0].buffer;
            order.deviceImage = req.files['deviceImage'][0].buffer;
        }

        // Update order status to 'complete'
        order.status = 'complete';

        // Save the order
        await order.save();

        // Remove files from memory (if needed)
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (file.path) {
                        const filePath = path.join(__dirname, file.path);
                        fs.unlinkSync(filePath);
                    }
                });
            });
        }

        return res.status(200).json({ message: 'Order completed successfully' });
    } catch (error) {
        console.error(error); // Log the error to the console
        return res.status(500).json({ error: 'Internal server error' });
    }
});



router.get('/api/get-invoice-data/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await OrderModel.findById(orderId).select('orderID firstName lastName email phone address zipCode city productDetails imeiNumber finalPrice ');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Extract necessary details
        const { orderID, firstName, lastName, email, phone, address, zipCode, city, productDetails, imeiNumber, finalPrice } = order;

        // Send JSON response
        res.json({ orderID, firstName, lastName, email, phone, address, zipCode, city, productDetails, imeiNumber, finalPrice });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/get-all-orders', async (req, res) => {
    try {
        const { page = 1, pageSize = 5, search = '', startDate, endDate } = req.query;
        const skip = (page - 1) * pageSize;

        const query = {};

        if (search) {
            query.$or = [
                { orderID: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { zipCode: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const allOrders = await OrderModel.find(query)
            .select('orderID firstName phone productDetails.productName productDetails.price status zipCode city scheduledPickup.pickupDate scheduledPickup.pickupTime email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(pageSize));

        const totalOrders = await OrderModel.countDocuments(query);

        res.json({
            totalRows: totalOrders,
            data: allOrders,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});





router.get('/user-orders/:email', async (req, res) => {
    try {
        const { email } = req.params;

        // Fetch orders based on user's email with selected fields
        const orders = await OrderModel.find({ email }).select({
            _id: 1, // include the id
            'orderID': 1,
            'productDetails.productName': 1,
            'productDetails.price': 1,
            status: 1,
        }).sort({ createdAt: -1 })

        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/orders/:orderId/documents', async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Fetch the order from the database
        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Extract deviceBill, idCard, and deviceImage from the order
        const { deviceBill, idCard, deviceImage } = order;

        // Convert Buffer data to base64 for client-side rendering
        const documentDetails = {
            deviceBill: deviceBill ? deviceBill.toString('base64') : null,
            idCard: idCard ? idCard.toString('base64') : null,
            deviceImage: deviceImage ? deviceImage.toString('base64') : null,
        };

        res.json(documentDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





module.exports = router;