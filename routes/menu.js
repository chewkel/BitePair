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
    res.json(result.rows);
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
    res.json(result.rows);
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
module.exports = router;
