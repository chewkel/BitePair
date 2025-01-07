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

router.get("/wines", async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                name, 
                origin, 
                category, 
                glass_price, 
                small_price, 
                medium_price, 
                large_price, 
                bottle_price
            FROM wine
            ORDER BY category, name;
        `;
        const result = await pool.query(query);

        const winesByCategory = {};
        result.rows.forEach(wine => {
            if (!winesByCategory[wine.category]) {
                winesByCategory[wine.category] = [];
            }
            winesByCategory[wine.category].push(wine);
        });

        res.render("wines_list.ejs", { winesByCategory });
    } catch (err) {
        console.error("Error fetching wine menu:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/wine/add", (req, res) => {
    res.render("add_wines.ejs");
}
);

router.post("/wine/add", async (req, res) => {
    const {
        name,
        origin,
        category,
        glass_price,
        small_price,
        medium_price,
        large_price,
        bottle_price,
    } = req.body;

    try {
        await pool.query(
            `
            INSERT INTO wine (name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
                name,
                origin,
                category,
                glass_price || null,
                small_price || null,
                medium_price || null,
                large_price || null,
                bottle_price || null,
            ]
        );
        res.redirect("/menu/wines");
    } catch (err) {
        console.error("Error adding wine:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/wine/edit", async (req, res) => {
    try {
        const winequery = `
            SELECT
                id, name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price
            FROM wine
        `;
        const wine = await pool.query(winequery);
        res.render("edit_wines.ejs", { wine: wine.rows });
    } catch (err) {
        console.error("Error fetching wine data:", err);
        res.status(500).send("Internal Server Error");
    }

});

router.post("/wine/edit", async (req, res) => {
    const { id, name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price } = req.body;

    if (!id || !name || !origin || !category) {
        return res.status(400).send("All fields are required");
    }

    let cleanCategory;
    if (Array.isArray(category)) {
        cleanCategory = category[1] ? category[1].trim() : null;
    } else {
        cleanCategory = category && typeof category === 'string' ? category.trim() : null;
    }

    console.log("Cleaned category:", cleanCategory);

    if (!cleanCategory) {
        return res.status(400).send("Invalid category provided");
    }

    try {
        const updateQuery = `
            UPDATE wine
            SET name = $1, origin = $2, category = $3, glass_price = $4, small_price = $5, medium_price = $6, large_price = $7, bottle_price = $8
            WHERE id = $9
        `;
        const result = await pool.query(updateQuery, [
            name,
            origin,
            cleanCategory,
            glass_price || null,
            small_price || null,
            medium_price || null,
            large_price || null,
            bottle_price || null,
            id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).send("Wine not found");
        }

        res.redirect("edit");
    } catch (err) {
        console.error("Error updating wine:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/wine/delete", async (req, res) => {
    try {
        const winequery = `
            SELECT
                id, name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price
            FROM wine
        `;
        const wine = await pool.query(winequery);
        res.render("delete_wines.ejs", { wine: wine.rows, selectedWine: null });
    } catch (err) {
        console.error("Error fetching wine data:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/wine/delete", async (req, res) => {
    const { id } = req.body; // This should be a single wine id

    // Validate the incoming data
    if (!id) {
        return res.status(400).send("Wine ID is required for deletion");
    }

    try {
        console.log("Attempting to delete wine with ID:", id);

        // Start the transaction
        await pool.query("BEGIN");

        // Now, delete the wine record
        await pool.query("DELETE FROM wine WHERE id = $1", [id]);

        // Commit the transaction
        await pool.query("COMMIT");

        // Redirect or respond with success
        res.redirect("/lists");
    } catch (err) {
        // In case of error, rollback the transaction
        console.error("Error deleting wine:", err);
        await pool.query("ROLLBACK");
        res.status(500).send("Internal Server Error");
    }
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

router.post("/editted", async (req, res) => {
    console.log(req.body);
    const { name, price, ingredients, allergens } = req.body;

    const category = req.body.category;
    const id = req.body.id;

    if (!id || !category) {
        return res.status(400).send("Invalid request");
    }

    const tableName = category === "food" ? "food" : "drinks";
    const allergenTable = category === "food" ? "food_allergen" : "drink_allergen";

    try {
        await pool.query("BEGIN");

        await pool.query(
            `UPDATE ${tableName} SET name = $1, price = $2, ingredients = $3 WHERE id = $4`,
            [name, price, ingredients, id]
        );

        await pool.query(`DELETE FROM ${allergenTable} WHERE ${category}_id = $1`, [id]);

        const ingredientsArray = ingredients.split(",").map((ing) => ing.trim().toLowerCase());
        const detectedAllergens = [];

        const allergenResults = await pool.query("SELECT id, name FROM allergen");
        allergenResults.rows.forEach((allergen) => {
            if (ingredientsArray.includes(allergen.name.toLowerCase())) {
                detectedAllergens.push(allergen.id);
            }
        });

        for (const allergenId of detectedAllergens) {
            await pool.query(
                `INSERT INTO ${allergenTable} (${category}_id, allergen_id) VALUES ($1, $2)`,
                [id, allergenId]
            );
        }

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

        const result = await pool.query(
            `INSERT INTO ${tableName} (name, price, ingredients) VALUES ($1, $2, $3) RETURNING id`,
            [name, price, ingredients]
        );

        const newItemId = result.rows[0].id;

        const ingredientsArray = ingredients
            .toLowerCase()
            .split(/[,;]+/)
            .map((ing) => ing.trim());

        const detectedAllergens = [];

        const allergenResults = await pool.query("SELECT id, name FROM allergen");
        allergenResults.rows.forEach((allergen) => {
            const allergenKeywords = allergenMapping[allergen.name.toLowerCase()];
            if (allergenKeywords) {

                const hasAllergen = ingredientsArray.some((ingredient) =>
                    allergenKeywords.some((keyword) => ingredient.includes(keyword))
                );
                if (hasAllergen) {
                    detectedAllergens.push(allergen.id);
                }
            }
        });

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
    const foreignKey = category === "food" ? "food_id" : "drink_id";

    try {

        await pool.query("BEGIN");

        await pool.query(`DELETE FROM ${allergenTable} WHERE ${foreignKey} = $1`, [id]);

        await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);

        await pool.query("COMMIT");

        res.redirect("/menu/delete");
    } catch (err) {
        console.error("Error deleting item:", err);
        await pool.query("ROLLBACK");
        res.status(500).send("Internal Server Error");
    }
});
module.exports = router;
