const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require('body-parser');

const authRoute = require("./routes/authentication");
const categoryRoute = require("./routes/category");
const brandRoute = require("./routes/brand");
const productRoute = require("./routes/product");
const userRoute = require("./routes/user");
const orderRoute = require("./routes/order");
const pincodeRoute = require("./routes/pincode");
const contactRoute = require("./routes/contact");
const statisticRoute = require("./routes/statistics");


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));


mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("DB Connection Successful"))
    .catch((err) => console.log(err))


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use("/auth", authRoute);
app.use("/category", categoryRoute);
app.use("/brand", brandRoute);
app.use("/product", productRoute);
app.use("/user", userRoute);
app.use("/order", orderRoute);
app.use("/pincode", pincodeRoute);
app.use("/contact", contactRoute);
app.use("/statistic", statisticRoute);


app.get("/", async (req, res) => {
    res.send("Selligo backend")
})

app.listen(5000, () => {
    console.log("Backend Server is Running")
})