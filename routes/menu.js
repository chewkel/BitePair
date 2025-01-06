const express = require('express');
const pool = require('../db');
const { render } = require('ejs');
const router = express.Router();

router.get('/food', async (req, res) => {
    const result = await pool.query(
        `SELECT f.id, f.name, f.price, f.ingredients, 
              COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS allergens
       FROM food f
       LEFT JOIN food_allergen fa ON f.id = fa.food_id
       LEFT JOIN allergen a ON fa.allergen_id = a.id
       GROUP BY f.id`
    );
    res.render("food.ejs", { food: result.rows });
});

router.get('/drinks', async (req, res) => {
    const result = await pool.query(
        `SELECT d.id, d.name, d.price, d.ingredients, 
              COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS allergens
       FROM drinks d
       LEFT JOIN drink_allergen da ON d.id = da.drink_id
       LEFT JOIN allergen a ON da.allergen_id = a.id
       GROUP BY d.id`
    );
    res.render("drinks.ejs", { drinks: result.rows });
});

router.get("/lists", async (req, res) => {
    try {
        const foodQuery = `
            SELECT 
                f.id, f.name, f.ingredients, f.price, 
                ARRAY_AGG(a.name) AS allergens
            FROM food f
            LEFT JOIN food_allergen fa ON f.id = fa.food_id
            LEFT JOIN allergen a ON fa.allergen_id = a.id
            GROUP BY f.id
        `;
        const food = await pool.query(foodQuery);

        const drinkQuery = `
            SELECT 
                d.id, d.name, d.ingredients, d.price, 
                ARRAY_AGG(a.name) AS allergens
            FROM drinks d
            LEFT JOIN drink_allergen da ON d.id = da.drink_id
            LEFT JOIN allergen a ON da.allergen_id = a.id
            GROUP BY d.id
        `;
        const drink = await pool.query(drinkQuery);

        res.render("lists.ejs", {
            food: food.rows,
            drink: drink.rows
        });

        // console.log(food.rows);
        // console.log(drink.rows);

    } catch (err) {
        console.error("Error fetching data for lists page:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/edit", async (req, res) => {
    try {
        const foodQuery = `
            SELECT 
                f.id, f.name, f.ingredients, f.price, 
                ARRAY_AGG(a.name) AS allergens
            FROM food f
            LEFT JOIN food_allergen fa ON f.id = fa.food_id
            LEFT JOIN allergen a ON fa.allergen_id = a.id
            GROUP BY f.id
        `;
        const food = await pool.query(foodQuery);

        const drinkQuery = `
            SELECT 
                d.id, d.name, d.ingredients, d.price, 
                ARRAY_AGG(a.name) AS allergens
            FROM drinks d
            LEFT JOIN drink_allergen da ON d.id = da.drink_id
            LEFT JOIN allergen a ON da.allergen_id = a.id
            GROUP BY d.id
        `;
        const drink = await pool.query(drinkQuery);

        const allergen = await pool.query('SELECT * FROM allergen');

        res.render("edit.ejs", {
            food: food.rows,
            drink: drink.rows,
            allergen: allergen.rows
        });

        // console.log(food.rows);
        // console.log(drink.rows);
        // console.log(allergen.rows);

    } catch (err) {
        console.error("Error fetching data for edit page:", err);
        res.status(500).send("Internal Server Error");
    }
});

// editted page  

router.post("/editted", async (req, res) => {
    console.log(req.body);
    const { name, price, ingredients, allergens } = req.body;

    // Determine if it's food or drink from a hidden input or additional info
    const category = req.body.category; // Should be sent as a hidden input in the form
    const id = req.body.id; // Also send the item ID in the form as a hidden input

    if (!id || !category) {
        return res.status(400).send("Invalid request");
    }

    const tableName = category === "food" ? "food" : "drinks";
    const allergenTable = category === "food" ? "food_allergen" : "drink_allergen";

    try {
        // Start a transaction
        await pool.query("BEGIN");

        // Update the food or drink details
        await pool.query(
            `UPDATE ${tableName} SET name = $1, price = $2, ingredients = $3 WHERE id = $4`,
            [name, price, ingredients, id]
        );

        // Remove old allergen associations for the item
        await pool.query(`DELETE FROM ${allergenTable} WHERE ${category}_id = $1`, [id]);

        // Automatically detect allergens based on ingredients
        const ingredientsArray = ingredients.split(",").map((ing) => ing.trim().toLowerCase());
        const detectedAllergens = [];

        const allergenResults = await pool.query("SELECT id, name FROM allergen");
        allergenResults.rows.forEach((allergen) => {
            if (ingredientsArray.includes(allergen.name.toLowerCase())) {
                detectedAllergens.push(allergen.id);
            }
        });

        // Insert new allergen associations
        for (const allergenId of detectedAllergens) {
            await pool.query(
                `INSERT INTO ${allergenTable} (${category}_id, allergen_id) VALUES ($1, $2)`,
                [id, allergenId]
            );
        }

        // Commit the transaction
        await pool.query("COMMIT");

        // Redirect back to the edit page or elsewhere
        // res.redirect("/menu/edit");
        res.send("Item updated successfully! <a href=" + "./edit" + ">Edit</a>");
    } catch (err) {
        console.error("Error updating item:", err);
        await pool.query("ROLLBACK");
        res.status(500).send("Internal Server Error");
    }
});

router.get("/add", (req, res) => {
    res.render("add_menu.ejs");
});

router.post("/added", async (req, res) => {
    const { category, name, price, ingredients } = req.body;

    if (!name || !price || !ingredients || !category) {
        return res.status(400).send("All fields are required");
    }

    const tableName = category === "food" ? "food" : "drinks";
    const allergenTable = category === "food" ? "food_allergen" : "drink_allergen";

    // Allergen mapping based on keywords
    const allergenMapping = {
        "nuts": ["nuts", "almond", "cashew", "pecan", "walnut", "hazelnut"],
        "dairy": ["milk", "cream", "cheese", "butter", "yogurt"],
        "gluten": ["wheat", "barley", "rye", "bread", "pasta"],
        "soy": ["soy", "tofu", "soymilk"],
        "eggs": ["egg", "eggs", "yolk"],
        "shellfish": ["shrimp", "lobster", "crab", "prawn"],
        "fish": ["fish", "salmon", "tuna", "cod"],
        "celery": ["celery"],
        "sesame": ["sesame", "tahini"],
        "sulphur dioxide": ["sulphur", "sulfur", "preservative"]
    };

    try {
        await pool.query("BEGIN");

        // Insert new item
        const result = await pool.query(
            `INSERT INTO ${tableName} (name, price, ingredients) VALUES ($1, $2, $3) RETURNING id`,
            [name, price, ingredients]
        );

        const newItemId = result.rows[0].id;

        // Normalize and split ingredients
        const ingredientsArray = ingredients
            .toLowerCase()
            .split(/[,;]+/) // Split by commas or semicolons
            .map((ing) => ing.trim());

        const detectedAllergens = [];

        // Fetch all allergens from the database
        const allergenResults = await pool.query("SELECT id, name FROM allergen");
        allergenResults.rows.forEach((allergen) => {
            const allergenKeywords = allergenMapping[allergen.name.toLowerCase()];
            if (allergenKeywords) {
                // Check if any keyword matches any ingredient
                const hasAllergen = ingredientsArray.some((ingredient) =>
                    allergenKeywords.some((keyword) => ingredient.includes(keyword))
                );
                if (hasAllergen) {
                    detectedAllergens.push(allergen.id);
                }
            }
        });

        // Insert detected allergens into the allergen table
        for (const allergenId of detectedAllergens) {
            await pool.query(
                `INSERT INTO ${allergenTable} (${category}_id, allergen_id) VALUES ($1, $2)`,
                [newItemId, allergenId]
            );
        }

        await pool.query("COMMIT");

        res.redirect("/menu/add");
    } catch (err) {
        console.error("Error adding item:", err);
        await pool.query("ROLLBACK");
        res.status(500).send("Internal Server Error");
    }
});

router.get("/delete", async (req, res) => {
    try {
        const food = await pool.query(`
            SELECT 
                f.id, f.name, f.price, 
                ARRAY_AGG(a.name) AS allergens
            FROM food f
            LEFT JOIN food_allergen fa ON f.id = fa.food_id
            LEFT JOIN allergen a ON fa.allergen_id = a.id
            GROUP BY f.id
        `);

        const drinks = await pool.query(`
            SELECT 
                d.id, d.name, d.price, 
                ARRAY_AGG(a.name) AS allergens
            FROM drinks d
            LEFT JOIN drink_allergen da ON d.id = da.drink_id
            LEFT JOIN allergen a ON da.allergen_id = a.id
            GROUP BY d.id
        `);

        res.render("delete_menu.ejs", {
            food: food.rows,
            drinks: drinks.rows
        });
    } catch (err) {
        console.error("Error fetching data for delete page:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/delete", async (req, res) => {
    const { category, id } = req.body;

    if (!category || !id) {
        return res.status(400).send("Invalid request");
    }

    const tableName = category === "food" ? "food" : "drinks";
    const allergenTable = category === "food" ? "food_allergen" : "drink_allergen";
    const foreignKey = category === "food" ? "food_id" : "drink_id"; // Dynamically set the foreign key column

    try {
        // Start a transaction
        await pool.query("BEGIN");

        // Delete associations in allergen table
        await pool.query(`DELETE FROM ${allergenTable} WHERE ${foreignKey} = $1`, [id]);

        // Delete the item
        await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);

        // Commit transaction
        await pool.query("COMMIT");

        res.redirect("/menu/delete");
    } catch (err) {
        console.error("Error deleting item:", err);
        await pool.query("ROLLBACK");
        res.status(500).send("Internal Server Error");
    }
});
module.exports = router;
