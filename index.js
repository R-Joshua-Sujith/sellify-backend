const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const multer = require('multer');
const XLSX = require('xlsx');
const axios = require("axios")
const Category = require("./models/Category");
const CategoryModel = require("./models/Category");
const BrandModel = require("./models/Brands");
const ProductModel = require("./models/Product")
const UserModel = require("./models/User")
const OrderModel = require("./models/Order")
const PincodeModel = require("./models/PinCode")
const ContactModel = require("./models/Contact");
const CounterModel = require("./models/Counter")
const Admin = require('./models/Admin');
const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const zip = require('express-zip');


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("DB Connection Successful"))
    .catch((err) => console.log(err))



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({ email, password: hashedPassword });
        await newAdmin.save();

        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/admin-login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // You can generate and send a token for authentication here

        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get("/get-all-categories", async (req, res) => {
    try {
        // Fetch all categories from the database
        const allCategories = await Category.find();

        // Respond with the array of categories
        res.status(200).json(allCategories);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/get-category/:id", async (req, res) => {
    try {
        // Fetch all categories from the database
        const category = await Category.findById(req.params.id);
        // Respond with the array of categories
        res.status(200).json(category);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/get-all-category-types", async (req, res) => {
    try {
        // Fetch all categories from the database and select only the category_type field
        const allCategoryTypes = await Category.find().select('_id category_type');
        // Extract the category_type values from the array of documents
        // Respond with the array of category_type values
        res.status(200).json(allCategoryTypes);
    } catch (error) {
        // Handle errors
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/add-category", async (req, res) => {
    try {
        const newCategory = await CategoryModel.create(req.body);
        res.status(201).json({ message: 'Category Added Successfully' });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.category_type) {
            res.status(400).json({ error: 'Category already exists' })
        } else {
            res.status(500).json({ error: "Internal Server Error" })
        }

    }
})

app.put('/updateCategory/:id', async (req, res) => {
    try {
        const category = await CategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.category_type) {
            res.status(400).json({ error: 'Brand already exists' })
        } else {
            res.status(500).json({ error: "Internal Server error" })
        }
    }
});



app.delete("/delete-category/:id", async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Category Deleted Successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/category/:category_type', async (req, res) => {
    try {
        const { category_type } = req.params;

        // Find the category that matches the specified category_type
        const category = await Category.findOne({ category_type });

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Extract attributes and sections from the category
        const { attributes, sections } = category;

        res.json({ category_type, attributes, sections });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.post("/add-brand", async (req, res) => {
    try {
        const brand = await BrandModel.create(req.body);
        res.status(201).json({ message: 'Brand Added Successfully' })
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.brandName) {
            res.status(400).json({ error: 'Brand already exists' })
        } else {
            res.status(500).json({ error: "Internal Server error" })
        }
    }
})

app.get('/brands', async (req, res) => {
    try {
        // Fetch all brands with only brandName and _id fields
        const brands = await BrandModel.find({}, 'brandName');

        // Send the response with the list of brand names and ids
        res.json(brands);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/brands/:id', async (req, res) => {
    try {
        const brand = await BrandModel.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Filter out keys with empty arrays
        const filteredSeries = Object.keys(brand.series)
            .filter((key) => brand.series[key].length > 0)
            .reduce((obj, key) => {
                obj[key] = brand.series[key];
                return obj;
            }, {});

        brand.series = filteredSeries;

        res.json(brand);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.put("/edit-brand/:id", async (req, res) => {
    try {
        const brand = await BrandModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        res.json({ message: 'Brand edited Successfully' });
    } catch (error) {
        res.status(400).json({ error: "Internal Server error" });
    }
})

app.delete('/delete-brand/:id', async (req, res) => {
    try {
        const brand = await BrandModel.findByIdAndDelete(req.params.id);
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        res.json({ message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// app.get('/brands-category/:categoryType', async (req, res) => {
//     try {
//         const categoryType = req.params.categoryType;

//         // Find all brands that have the specified categoryType in their series object
//         const brands = await BrandModel.find({ [`series.${categoryType}`]: { $exists: true, $not: { $size: 0 } } });

//         if (brands.length === 0) {
//             return res.status(404).json({ error: 'No brands found for the specified category type' });
//         }

//         // Extract only the _id and brandName fields from each brand
//         const brandNames = brands.map(brand => ({ _id: brand._id, brandName: brand.brandName, brandImage: brand.brandImage }));

//         res.json(brandNames);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
app.get('/brands-category/:categoryType', async (req, res) => {
    try {
        const categoryType = req.params.categoryType;

        // Find all brands that have the specified categoryType in their series object
        const brands = await BrandModel.find({ [`series.${categoryType}`]: { $exists: true, $not: { $size: 0 } } });

        if (brands.length === 0) {
            return res.status(404).json({ error: 'No brands found for the specified category type' });
        }

        // Extract only the _id and brandName fields from each brand
        const brandNames = [];

        for (const brand of brands) {
            // Count the number of products for each brand with the specified categoryType
            const productCount = await ProductModel.countDocuments({
                brandName: brand.brandName,
                categoryType: categoryType
            });

            brandNames.push({
                _id: brand._id,
                brandName: brand.brandName,
                brandImage: brand.brandImage,
                productCount: productCount
            });
        }

        res.json(brandNames);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/series/:brandName/:categoryType', async (req, res) => {
    try {
        const { brandName, categoryType } = req.params;

        // Find the brand that matches the specified brandName
        const brand = await BrandModel.findOne({ brandName });

        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Check if the specified categoryType exists in the brand's series object
        if (!brand.series[categoryType]) {
            return res.status(404).json({ error: 'Category type not found for this brand' });
        }

        // Fetch all seriesName values under the specified categoryType
        const seriesNames = brand.series[categoryType].map(seriesItem => seriesItem.seriesName);

        res.json(seriesNames);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// API endpoint to list all models under a specific category, brand, and series
app.get('/models/:category/:brand/:series', async (req, res) => {
    try {
        const { category, brand, series } = req.params;

        // Find the brand that matches the specified brandName
        const brandData = await BrandModel.findOne({ brandName: brand });

        if (!brandData) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        // Check if the specified category exists in the brand's series object
        if (!brandData.series[category]) {
            return res.status(404).json({ error: 'Category not found for this brand' });
        }

        // Find the series that matches the specified seriesName
        const seriesData = brandData.series[category].find((item) => item.seriesName === series);

        if (!seriesData) {
            return res.status(404).json({ error: 'Series not found for this category' });
        }

        // Extract and return the models for the specified series
        const models = seriesData.models;
        res.json(models);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.post('/create-products', async (req, res) => {
    try {
        const { productImage, basePrice, variant, brandName, seriesName, categoryType, model, dynamicFields } = req.body;
        const newProduct = new ProductModel({ productImage, basePrice, variant, brandName, seriesName, categoryType, model, dynamicFields });
        const savedProduct = await newProduct.save();
        res.json(savedProduct);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.productName) {
            res.status(400).json({ error: 'Product already exists' })
        } else {
            res.status(500).json({ error: "Internal Server error" })
        }
    }
});

// Assuming you have your ProductModel and app.post('/create-products') code above

// Add a new route to get products based on categoryType and brandName
app.get('/get-products/:categoryType/:brandName', async (req, res) => {
    try {
        const { categoryType, brandName } = req.params;

        if (!categoryType || !brandName) {
            return res.status(400).json({ error: 'Both categoryType and brandName are required parameters' });
        }

        const products = await ProductModel.find({ categoryType, brandName });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server error' });
    }
});

app.get('/get-products/:categoryType', async (req, res) => {
    try {
        const { categoryType } = req.params;

        if (!categoryType) {
            return res.status(400).json({ error: 'Category Type is required' });
        }

        // Find the top 5 products with the highest basePrice
        const products = await ProductModel.find({ categoryType })
            .sort({ basePrice: -1 }) // Sort in descending order of basePrice
            .limit(5); // Limit the results to 5

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server error' });
    }
});


// app.get('/get-all-products', async (req, res) => {
//     try {
//         const allProducts = await ProductModel.find();
//         res.json(allProducts);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

app.get('/get-all-products', async (req, res) => {
    try {
        const { page = 1, pageSize = 5, search = '' } = req.query;
        const skip = (page - 1) * pageSize;

        // Use a regular expression to make the search case-insensitive and partial
        const searchRegex = new RegExp(search, 'i');

        const query = {
            $or: [
                { brandName: searchRegex },
                { seriesName: searchRegex },
                { model: searchRegex },
                { variant: searchRegex },
            ],
        };

        const allProducts = await ProductModel.find(query).skip(skip).limit(parseInt(pageSize));
        const totalProducts = await ProductModel.countDocuments(query);

        res.json({
            totalRows: totalProducts,
            data: allProducts,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/products/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;

        // Validate that the provided ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await ProductModel.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/update-product/:productId', async (req, res) => {
    const { productId } = req.params;
    const updateData = req.body;

    try {
        // Find the product by _id
        const existingProduct = await ProductModel.findById(productId);

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update the product data
        Object.assign(existingProduct, updateData);

        // Save the updated product
        const updatedProduct = await existingProduct.save();

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.delete('/delete-product/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        // Find and remove the product by _id
        const deletedProduct = await ProductModel.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    // Find user by email or create a new user
    let user = await UserModel.findOne({ email });

    if (!user) {
        // Create a new user if not found
        user = new UserModel({ email });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false });
    const otpExpiry = Date.now() + 600000; // 10 minutes

    // Save OTP and its expiry to user
    user.otp = otp;
    user.otpExpiry = otpExpiry;

    try {
        await user.save();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to save user' });
    }

    // Send email with OTP
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'joshuasujith14@gmail.com',
            pass: 'ncbbbbtrcqqjuvpc',
        },
    });

    const mailOptions = {
        from: 'joshuasujith14@gmail.com',
        to: email,
        subject: 'OTP Verification',
        text: `You are receiving this email for OTP verification in Sellify. Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: 'Failed to send OTP' });
        }

        res.json({ message: 'OTP Sent' });
    });
});

app.post('/login', async (req, res) => {
    const { otp, email } = req.body;

    // Find user by reset token, OTP, and email
    const user = await UserModel.findOne({
        email,
        otp,
        otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid OTP or email' });
    }

    // Clear OTP and OTP expiry after successful reset
    user.otp = undefined;
    user.otpExpiry = undefined;

    try {
        await user.save();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server Error' });
    }

    res.json({ message: 'Login Successful' });
});

app.post('/api/users/:email', async (req, res) => {
    const { email } = req.params;
    const { firstName, lastName, phone, addPhone, address, zipCode, city } = req.body;

    try {
        // Find the user by email
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            // Update the existing user's information
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.phone = phone;
            existingUser.addPhone = addPhone || '';
            existingUser.address = address;
            existingUser.zipCode = zipCode;
            existingUser.city = city;

            await existingUser.save();
            res.status(200).json({ message: 'User information updated successfully.' });
        } else {
            // Create a new user if not exists
            const newUser = new UserModel({
                email,
                firstName,
                lastName,
                phone,
                addPhone: addPhone || '',
                address,
                zipCode,
                city,
            });

            await newUser.save();
            res.status(201).json({ message: 'User created successfully.' });
        }
    } catch (error) {
        console.error('Error storing user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/users-fill/:email', async (req, res) => {
    const { email } = req.params;
    const { firstName, lastName, phone, addPhone, address, zipCode, city } = req.body;

    try {
        // Find the user by email
        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            // Update the existing user's information
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.phone = phone;
            existingUser.addPhone = addPhone || '';


            await existingUser.save();
            res.status(200).json({ message: 'User information updated successfully.' });
        } else {
            // Create a new user if not exists
            const newUser = new UserModel({
                email,
                firstName,
                lastName,
                phone,
                addPhone: addPhone || '',

            });

            await newUser.save();
            res.status(201).json({ message: 'User created successfully.' });
        }
    } catch (error) {
        console.error('Error storing user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/api/users/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // Find the user by email
        const user = await UserModel.findOne({ email });

        if (user) {
            const userData = {
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                addPhone: user.addPhone,
                address: user.address,
                zipCode: user.zipCode,
                city: user.city,
            };

            res.status(200).json(userData);
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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
        return `Sellify${sequenceValue}`;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to generate custom ID");
    }
}


app.post('/create-order', async (req, res) => {
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
            options
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
            options
        });

        // Save the new order to the database
        const savedOrder = await newOrder.save();

        res.status(201).json({ message: 'Order created successfully', order: savedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/api/orders/:orderId/processing', async (req, res) => {
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

app.put('/:orderId/cancel', async (req, res) => {
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

app.get('/single-orders/:id', async (req, res) => {
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

app.put('/api/orders/:orderId/complete', upload.fields([
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



app.get('/api/get-invoice-data/:orderId', async (req, res) => {
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


app.get('/get-all-orders', async (req, res) => {
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


// app.get('/get-all-orders', async (req, res) => {
//     try {
//         const { page = 1, pageSize = 5, search = '' } = req.query;
//         const skip = (page - 1) * pageSize;

//         const query = {};

//         if (search) {
//             query.$or = [
//                 { orderID: { $regex: search, $options: 'i' } }, // Case-insensitive search for orderID
//                 { phone: { $regex: search, $options: 'i' } },
//                 { firstName: { $regex: search, $options: 'i' } },  // Case-insensitive search for firstName
//                 // Add more fields as needed for searching
//             ];
//         }



//         const allOrders = await OrderModel.find(query)
//             .select('orderID firstName phone productDetails.productName productDetails.price status')
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(parseInt(pageSize));

//         const totalOrders = await OrderModel.countDocuments(query);

//         res.json({
//             totalRows: totalOrders,
//             data: allOrders,
//         });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });





app.get('/user-orders/:email', async (req, res) => {
    try {
        const { email } = req.params;

        // Fetch orders based on user's email with selected fields
        const orders = await OrderModel.find({ email }).select({
            _id: 1, // include the id
            'orderID': 1,
            'productDetails.productName': 1,
            'productDetails.price': 1,
            status: 1,
        });

        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/orders/:orderId/documents', async (req, res) => {
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



app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Process the uploaded file (assuming it's in XLSX format)
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Process the data and update/create records in MongoDB
        for (const row of data.slice(1)) {
            // Assuming the unique identifier is in the first column (index 0)
            const uniqueIdentifier = row[0];

            // Check if an entry with the same unique identifier exists
            const existingItem = await ItemModel.findOne({ _id: uniqueIdentifier });

            if (existingItem) {
                // Update existing entry
                existingItem.name = row[1];
                existingItem.age = row[2];
                existingItem.address.city = row[3];
                existingItem.address.country = row[4];
                await existingItem.save();
            } else {
                // Create a new entry with MongoDB's default _id
                const newItem = new ItemModel({
                    name: row[1],
                    age: row[2],
                    address: {
                        city: row[3],
                        country: row[4],
                        state: row[5]
                    }
                });
                await newItem.save();
            }
        }

        res.status(200).send('File uploaded and data processed successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/download', async (req, res) => {
    try {
        const items = await ItemModel.find();

        // Create a worksheet
        const ws = XLSX.utils.json_to_sheet(items.map(item => ({
            ID: item._id.toString(), // Convert ObjectId to string
            Name: item.name,
            Age: item.age,
            City: item.address.city,
            Country: item.address.country,
        })));

        // Create a workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Items');

        // Save to buffer
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Set response headers
        res.setHeader('Content-Disposition', 'attachment; filename=items.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send the file as the response
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/generate-excel/:categoryType', async (req, res) => {
    try {
        const categoryType = req.params.categoryType;

        // Make an API call to fetch the category document based on categoryType
        const response = await axios.get(`http://localhost:5000/api/category/${categoryType}`);
        const category = response.data;

        // Check if the category document is empty or undefined
        if (!category) {
            return res.status(404).json({ error: 'Category not found for the given categoryType.' });
        }
        const headers = ['_id', 'categoryType', 'brandName', 'seriesName', 'model', 'variant', 'basePrice', 'productImage']

        // Extract attributes
        if (category.attributes) {
            category.attributes.forEach(attribute => {

                attribute.options.forEach(option => {

                    headers.push(`${option.optionHeading}`);
                });
            });
        }

        // Extract sections
        if (category.sections) {
            category.sections.forEach(section => {

                section.options.forEach(option => {
                    headers.push(`${option.optionHeading}`);
                });
            });
        }

        // Create an empty worksheet
        const ws = XLSX.utils.aoa_to_sheet([headers]);

        // Create a workbook and add the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Save the workbook to a file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=excel_template.xlsx`);
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error fetching category document:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.post('/api/products/bulk-upload', upload.single('file'), async (req, res) => {
    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Check for empty Excel data
        if (excelData.length === 0) {
            return res.status(400).json({ error: 'Excel data is empty.' });
        }
        const allHeaders = excelData[0];

        const dynamic = allHeaders.filter((item) => !['_id', 'categoryType', 'brandName', 'seriesName', 'model', 'variant', 'basePrice', 'productImage'].includes(item));

        for (const row of excelData.slice(1)) {
            const uniqueIdentifier = row[0];
            const existingItem = await ProductModel.findOne({ _id: uniqueIdentifier })
            const dynamicOptions = [];
            let i = 8;
            for (let x of dynamic) {
                dynamicOptions.push({
                    optionHeading: x,
                    optionValue: row[i]
                })
                i++;
            }
            if (existingItem) {

                existingItem.categoryType = row[1];
                existingItem.brandName = row[2];
                existingItem.seriesName = row[3];
                existingItem.model = row[4];
                existingItem.variant = row[5];
                existingItem.basePrice = row[6];
                existingItem.productImage = row[7];
                existingItem.dynamicFields = dynamicOptions;

                await existingItem.save();
            } else {
                const newProduct = new ProductModel({
                    categoryType: row[1],
                    brandName: row[2],
                    seriesName: row[3],
                    model: row[4],
                    variant: row[5],
                    basePrice: row[6],
                    productImage: row[7],
                    dynamicFields: dynamicOptions,
                })
                await newProduct.save();
            }
        }


        res.status(200).json({ message: 'Bulk upload successful' });
    } catch (error) {
        console.error('Error during bulk upload:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.get('/api/products/bulk-download/:categoryType', async (req, res) => {
    try {
        // Fetch all products from the database
        const categoryType = req.params.categoryType;
        if (!categoryType) {
            return res.status(400).json({ error: 'Category type is required in the route parameters.' });
        }
        const products = await ProductModel.find({ categoryType });
        // Check if there are any products
        if (products.length === 0) {
            return res.status(404).json({ error: 'No products found for bulk download.' });
        }

        // Create an array to store Excel data
        const excelData = [];

        // Add headers to the Excel data
        const headers = ['_id', 'categoryType', 'brandName', 'seriesName', 'model', 'variant', 'basePrice', 'productImage'];

        // Assuming dynamicFields is an array in each product document
        if (products[0].dynamicFields) {
            products[0].dynamicFields.forEach(dynamicField => {
                headers.push(dynamicField.optionHeading);
            });
        }

        excelData.push(headers);

        // Add product data to the Excel data
        products.forEach(product => {
            const rowData = [product._id.toString(), product.categoryType, product.brandName, product.seriesName, product.model, product.variant, product.basePrice, product.productImage];

            // Add dynamic field values to the row
            if (product.dynamicFields) {
                product.dynamicFields.forEach(dynamicField => {
                    rowData.push(dynamicField.optionValue);
                });
            }

            excelData.push(rowData);
        });

        // Create a worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Create a workbook and add the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Save the workbook to a file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Set headers for the response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=bulk_download.xlsx');

        // Send the Excel file as the response
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error during bulk download:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.post('/create/pincode', async (req, res) => {
    try {
        const pincodeData = req.body;
        const newPincode = new PincodeModel(pincodeData);
        const savedPincode = await newPincode.save();
        res.status(201).json(savedPincode);
    } catch (error) {
        console.error('Error saving pin code:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/get-all-pincodes', async (req, res) => {
    try {
        const { page = 1, pageSize = 5 } = req.query;
        const skip = (page - 1) * pageSize;

        const allPincodes = await PincodeModel.find().skip(skip).limit(parseInt(pageSize));
        const totalPincodes = await PincodeModel.countDocuments();

        res.json({
            totalRows: totalPincodes,
            data: allPincodes,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/get-pincode/:id', async (req, res) => {
    try {
        const pincodeId = req.params.id;

        const pincode = await PincodeModel.findById(pincodeId);

        if (!pincode) {
            return res.status(404).json({ error: 'Pincode not found' });
        }

        res.json(pincode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/update-pincode/:id', async (req, res) => {
    try {
        const pincodeId = req.params.id;
        const updatedData = req.body;

        // Validate if the request body contains valid data
        if (!updatedData || Object.keys(updatedData).length === 0) {
            return res.status(400).json({ error: 'Invalid update data' });
        }

        // Find the pin code by ID and update it
        const updatedPincode = await PincodeModel.findByIdAndUpdate(
            pincodeId,
            updatedData,
            { new: true }
        );

        // Check if the pin code was found and updated
        if (!updatedPincode) {
            return res.status(404).json({ error: 'Pincode not found' });
        }

        res.json(updatedPincode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/check-pincode/:pincode', async (req, res) => {
    try {
        const requestedPincode = req.params.pincode;

        // Use Mongoose to find if the pin code exists in any document
        const pincodeExists = await PincodeModel.exists({ 'pinCodes': { $in: [requestedPincode] } });

        res.json({ pincodeExists });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/delete-pincode/:id', async (req, res) => {
    try {
        const pincodeId = req.params.id;

        // Use Mongoose to find and delete the pin code by ID
        const deletedPincode = await PincodeModel.findByIdAndDelete(pincodeId);

        if (!deletedPincode) {
            return res.status(404).json({ message: 'Pin code not found' });
        }

        res.json({ message: 'Pin code deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Create a new contact instance
        const newContact = new ContactModel({
            name,
            email,
            phone,
            message,
        });

        // Save the contact to the database
        const savedContact = await newContact.save();

        res.status(201).json(savedContact);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


app.get('/get-all-users', async (req, res) => {
    try {
        const { page = 1, pageSize = 5, search = '' } = req.query;
        const skip = (page - 1) * pageSize;

        const query = {};

        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { zipCode: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        const allUsers = await UserModel.find(query)
            .select('email firstName lastName phone addPhone address zipCode city')
            .sort({ createdAt: -1 }) // Assuming you have a createdAt field in your UserSchema
            .skip(skip)
            .limit(parseInt(pageSize));

        const totalUsers = await UserModel.countDocuments(query);

        res.json({
            totalRows: totalUsers,
            data: allUsers,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


app.listen(5000, () => {
    console.log("Backend Server is Running")
})