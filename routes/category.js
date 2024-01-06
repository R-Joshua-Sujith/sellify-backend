const router = require("express").Router();
const CategoryModel = require("../models/Category")
const XLSX = require('xlsx');
const axios = require("axios")

router.get("/get-all-categories", async (req, res) => {
    try {
        // Fetch all categories from the database
        const allCategories = await CategoryModel.find();

        // Respond with the array of categories
        res.status(200).json(allCategories);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/get-category/:id", async (req, res) => {
    try {
        // Fetch all categories from the database
        const category = await CategoryModel.findById(req.params.id);
        // Respond with the array of categories
        res.status(200).json(category);
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get("/get-all-category-types", async (req, res) => {
    try {
        // Fetch all categories from the database and select only the category_type field
        const allCategoryTypes = await CategoryModel.find().select('_id category_type');
        // Extract the category_type values from the array of documents
        // Respond with the array of category_type values
        res.status(200).json(allCategoryTypes);
    } catch (error) {
        // Handle errors
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/add-category", async (req, res) => {
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

router.put('/updateCategory/:id', async (req, res) => {
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



router.delete("/delete-category/:id", async (req, res) => {
    try {
        await CategoryModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Category Deleted Successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/api/category/:category_type', async (req, res) => {
    try {
        const { category_type } = req.params;

        // Find the category that matches the specified category_type
        const category = await CategoryModel.findOne({ category_type });

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

router.get('/generate-excel/:categoryType', async (req, res) => {
    try {
        const categoryType = req.params.categoryType;

        // Make an API call to fetch the category document based on categoryType
        const response = await axios.get(`http://localhost:5000/category/api/category/${categoryType}`);
        const category = response.data;

        // Check if the category document is empty or undefined
        if (!category) {
            return res.status(404).json({ error: 'Category not found for the given categoryType.' });
        }
        const headers = ['_id', 'categoryType', 'brandName', 'seriesName', 'model', 'variant', 'basePrice', 'productImage', 'bestSelling'];

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




module.exports = router;