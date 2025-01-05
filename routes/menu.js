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

        console.log(food.rows);
        console.log(drink.rows);
        console.log(allergen.rows);

    } catch (err) {
        console.error("Error fetching data for edit page:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/editted"), async (req, res) => {

    //   output its been editted and the current and the new change
    res.send("It's been editted");
    console.log(req.body);

};

router.get("/test"), async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);

        res.status(500).json({ error: 'Database error' });
    }
}

module.exports = router;
