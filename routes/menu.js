const express = require("express");
const pool = require("../db");
const { render } = require("ejs");
const router = express.Router();
const { OpenAI } = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get the icon class for a given allergen
function getAllergenIcon(allergen) {
  const allergenIcons = {
    Dairy: "fa-solid fa-glass-water",
    Eggs: "fa-solid fa-egg",
    Peanuts: "fa-solid fa-peanut",
    Nuts: "fa-solid fa-seedling",
    Soy: "fa-solid fa-leaf",
    Wheat: "fa-solid fa-bread-slice",
    Fish: "fa-solid fa-fish",
    Shellfish: "fa-solid fa-shrimp",
    Sesame: "fa-solid fa-seedling",
    Gluten: "fa-solid fa-bread-slice",
  };

  return allergenIcons[allergen] || "fa-solid fa-question";
}

// GET request to fetch food menu
router.get("/food", async (req, res) => {
  try {
    const foodQuery = `
        SELECT 
            f.id AS food_id, -- Explicitly alias the food table's id column
            f.name,
            f.ingredients,
            f.price,
            f.category,
            ARRAY_AGG(a.name) AS allergens
        FROM food f
        LEFT JOIN food_allergen fa ON f.id = fa.food_id
        LEFT JOIN allergen a ON fa.allergen_id = a.id
        GROUP BY f.id, f.name, f.ingredients, f.price, f.category
        ORDER BY f.category, f.name;
    `;
    const food = await pool.query(foodQuery);

    const groupedFood = food.rows.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    res.render("food.ejs", { groupedFood, getAllergenIcon });
  } catch (err) {
    console.error("Error fetching food menu:", err);
    res.status(500).send("Internal Server Error");
  }
});

// json view for food menu
router.get("/foodtest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.name, f.price, f.ingredients, 
                  COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS allergens
           FROM food f
           LEFT JOIN food_allergen fa ON f.id = fa.food_id
           LEFT JOIN allergen a ON fa.allergen_id = a.id
           GROUP BY f.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching food menu:", err);
    res.status(500).send("Internal Server Error");
  }
});

// json view for drinks menu
router.get("/drinkstest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.price, d.ingredients, 
                  COALESCE(array_agg(a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS allergens
           FROM drinks d
           LEFT JOIN drink_allergen da ON d.id = da.drink_id
           LEFT JOIN allergen a ON da.allergen_id = a.id
           GROUP BY d.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching drinks menu:", err);
    res.status(500).send("Internal Server Error");
  }
});

// json view for wine menu
router.get("/winetest", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price
            FROM wine`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching wine menu:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET request to fetch drinks menu
router.get("/drinks", async (req, res) => {
  try {
    const drinksQuery = `SELECT
            d.id AS drink_id,
            d.name,
            d.ingredients,
            d.price,
            d.category,
            ARRAY_AGG(a.name) AS allergens
        FROM drinks d
        LEFT JOIN drink_allergen da ON d.id = da.drink_id
        LEFT JOIN allergen a ON da.allergen_id = a.id
        GROUP BY d.id, d.name, d.ingredients, d.price, d.category
        ORDER BY d.category, d.name;
    `;
    const drinks = await pool.query(drinksQuery);

    const groupedDrinks = drinks.rows.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    res.render("drinks.ejs", { groupedDrinks });
  } catch (err) {
    console.error("Error fetching drinks menu:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET request to fetch wine menu
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
    result.rows.forEach((wine) => {
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

// GET request to render the add wine page
router.get("/wine/add", (req, res) => {
  res.render("add_wines.ejs");
});

// POST request to add a new wine
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

// GET request to render the edit wine page
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

// POST request to update a wine
router.post("/wine/edit", async (req, res) => {
  const {
    id,
    name,
    origin,
    category,
    glass_price,
    small_price,
    medium_price,
    large_price,
    bottle_price,
  } = req.body;

  if (!id || !name || !origin || !category) {
    return res.status(400).send("All fields are required");
  }

  let cleanCategory;
  if (Array.isArray(category)) {
    cleanCategory = category[1] ? category[1].trim() : null;
  } else {
    cleanCategory =
      category && typeof category === "string" ? category.trim() : null;
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
      id,
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

// GET request to render the delete wine page
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

// POST request to delete a wine
router.post("/wine/delete", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send("Wine ID is required for deletion");
  }

  try {
    console.log("Attempting to delete wine with ID:", id);

    await pool.query("BEGIN");

    await pool.query("DELETE FROM wine WHERE id = $1", [id]);

    await pool.query("COMMIT");

    res.redirect("/lists");
  } catch (err) {
    console.error("Error deleting wine:", err);
    await pool.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  }
});

// GET request to fetch all menu items
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

    const wineQuery = `
            SELECT
                id, name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price
            FROM wine
        `;
    const wine = await pool.query(wineQuery);

    res.render("lists.ejs", {
      food: food.rows,
      drink: drink.rows,
      wine: wine.rows,
    });

    // console.log(food.rows); // Debugging line as previously was getting undefined from moving data across pages
    // console.log(drink.rows);
  } catch (err) {
    console.error("Error fetching data for lists page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// GET request to render the edit menu page
router.get("/edit", async (req, res) => {
  try {
    const foodQuery = `
            SELECT 
                f.id, f.name, f.ingredients, f.price, f.category,
                ARRAY_AGG(a.name) AS allergens
            FROM food f
            LEFT JOIN food_allergen fa ON f.id = fa.food_id
            LEFT JOIN allergen a ON fa.allergen_id = a.id
            GROUP BY f.id
        `;
    const food = await pool.query(foodQuery);

    const drinkQuery = `
            SELECT 
                d.id, d.name, d.ingredients, d.price, d.category,
                ARRAY_AGG(a.name) AS allergens
            FROM drinks d
            LEFT JOIN drink_allergen da ON d.id = da.drink_id
            LEFT JOIN allergen a ON da.allergen_id = a.id
            GROUP BY d.id
        `;
    const drink = await pool.query(drinkQuery);

    const allergen = await pool.query("SELECT * FROM allergen");

    res.render("edit.ejs", {
      food: food.rows,
      drink: drink.rows,
      allergen: allergen.rows,
    });
  } catch (err) {
    console.error("Error fetching data for edit page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// POST request to update a menu item
router.post("/edited", async (req, res) => {
  console.log(req.body);
  const { id, type_category, name, price, ingredients, category } = req.body;

  if (!id || !category) {
    return res.status(400).send("Invalid request");
  }

  const tableName = type_category === "food" ? "food" : "drinks";
  const allergenTable =
    type_category === "food" ? "food_allergen" : "drink_allergen";

  const allergenMapping = {
    nuts: ["nuts", "almond", "cashew", "pecan", "walnut", "hazelnut"],
    dairy: ["milk", "cream", "cheese", "butter", "yogurt"],
    gluten: ["wheat", "barley", "rye", "bread", "pasta"],
    soy: ["soy", "tofu", "soymilk"],
    eggs: ["egg", "eggs", "yolk"],
    shellfish: ["shrimp", "lobster", "crab", "prawn"],
    fish: ["fish", "salmon", "tuna", "cod"],
    celery: ["celery"],
    sesame: ["sesame", "tahini"],
    "sulphur dioxide": ["sulphur", "sulfur", "preservative"],
  };

  try {
    await pool.query("BEGIN");

    await pool.query(
      `UPDATE ${tableName} SET name = $1, price = $2, ingredients = $3, category = $4 WHERE id = $5`,
      [name, price, ingredients, category, id]
    );

    await pool.query(
      `DELETE FROM ${allergenTable} WHERE ${type_category}_id = $1`,
      [id]
    );

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
        `INSERT INTO ${allergenTable} (${type_category}_id, allergen_id) VALUES ($1, $2)`,
        [id, allergenId]
      );
    }

    await pool.query("COMMIT");

    res.send("Item updated successfully! <a href='./edit'>Back to Edit</a>");
  } catch (err) {
    console.error("Error updating item:", err);
    await pool.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  }
});

// GET request to render the add menu page
router.get("/add", (req, res) => {
  const subcategories = {
    food: [
      "Burgers & Sandwiches",
      "Sides",
      "Small Plates",
      "Nibbles",
      "To Share",
      "Large Plates",
      "Salads",
      "Fries & Tatties",
    ],
    drinks: [
      "Smoothies",
      "Classics & Twists",
      "Martinis",
      "Spritzes",
      "Zero-proofs",
      "Bottled beers",
      "Bottled ciders",
      "Hot drinks",
      "Fresh juices",
    ],
  };

  const allergens = [
    { id: 1, name: "Gluten" },
    { id: 2, name: "Dairy" },
    { id: 3, name: "Nuts" },
    { id: 4, name: "Shellfish" },
    { id: 5, name: "Eggs" },
  ];

  res.render("add_menu.ejs", {
    subcategories,
    allergens,
  });
});

// POST request to add a new menu item
router.post("/added", async (req, res) => {
  const { category, subcategory, name, price, ingredients } = req.body;

  if (!name || !price || !ingredients || !category || !subcategory) {
    return res.status(400).send("All fields are required");
  }

  const tableName = category === "food" ? "food" : "drinks";
  const allergenTable =
    category === "food" ? "food_allergen" : "drink_allergen";

  const allergenMapping = {
    nuts: ["nuts", "almond", "cashew", "pecan", "walnut", "hazelnut"],
    dairy: ["milk", "cream", "cheese", "butter", "yogurt"],
    gluten: ["wheat", "barley", "rye", "bread", "pasta"],
    soy: ["soy", "tofu", "soymilk"],
    eggs: ["egg", "eggs", "yolk"],
    shellfish: ["shrimp", "lobster", "crab", "prawn"],
    fish: ["fish", "salmon", "tuna", "cod"],
    celery: ["celery"],
    sesame: ["sesame", "tahini"],
    "sulphur dioxide": ["sulphur", "sulfur", "preservative"],
  };

  try {
    await pool.query("BEGIN");

    const result = await pool.query(
      `INSERT INTO ${tableName} (name, ingredients, price, category) VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, ingredients, price, subcategory]
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

// GET request to render the delete menu page
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
      drinks: drinks.rows,
    });
  } catch (err) {
    console.error("Error fetching data for delete page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// POST request to delete a menu item
router.post("/delete", async (req, res) => {
  const { category, id } = req.body;

  if (!category || !id) {
    return res.status(400).send("Invalid request");
  }

  const tableName = category === "food" ? "food" : "drinks";
  const allergenTable =
    category === "food" ? "food_allergen" : "drink_allergen";
  const foreignKey = category === "food" ? "food_id" : "drink_id";

  try {
    await pool.query("BEGIN");

    await pool.query(`DELETE FROM ${allergenTable} WHERE ${foreignKey} = $1`, [
      id,
    ]);

    await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);

    await pool.query("COMMIT");

    res.redirect("/menu/delete");
  } catch (err) {
    console.error("Error deleting item:", err);
    await pool.query("ROLLBACK");
    res.status(500).send("Internal Server Error");
  }
});

// GET request to fetch the menu page
router.get("/menu", async (req, res) => {
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

    let wine = [];
    try {
      const winesResult = await pool.query(`
        SELECT
          id, name, origin, category, glass_price, small_price, medium_price, large_price, bottle_price
        FROM wine

      `);
      wine = winesResult.rows;
    } catch (wineError) {
      console.error(
        "Error fetching wines (showing menu without wines):",
        wineError
      );
      wine = [];
    }

    res.render("menu.ejs", {
      food: food.rows,
      drinks: drinks.rows,
      wine: wine,
      getAllergenIcon,
    });
  } catch (err) {
    console.error("Error fetching data for menu page:", err);
    res.status(500).send("Internal Server Error");
  }
});

// the pairing AI endpoint 

// having the food, drinks and wine in rows for the AI to use
async function getMenuItemsCategorized() {
  const foodQuery = `SELECT id, name, price FROM food`;
  const drinkQuery = `SELECT id, name, price FROM drinks`;
  const wineQuery = `SELECT id, name, glass_price, small_price, medium_price, large_price, bottle_price FROM wine`;

  const [food, drinks, wine] = await Promise.all([
    pool.query(foodQuery),
    pool.query(drinkQuery),
    pool.query(wineQuery),
  ]);

  return {
    food: food.rows,
    drinks: drinks.rows,
    wine: wine.rows,
  };
}

// POST request to get pairing suggestion with AI
router.post('/pairing-ai', async (req, res) => {
  try {
    const { itemName } = req.body;
    const { food, drinks, wine } = await getMenuItemsCategorized();

    const allItems = [...food, ...drinks, ...wine];
    const selectedItem = allItems.find(item => item.name === itemName);

    if (!selectedItem) {
      return res.json({ suggestion: null });
    }

    const isFood = food.some(f => f.name === itemName);
    const isDrink = drinks.some(d => d.name === itemName);
    const isWine = wine.some(w => w.name === itemName);

    let oppositeCategoryItems = [];

    if (isFood) {
      oppositeCategoryItems = [...drinks, ...wine];
    } else if (isDrink || isWine) {
      oppositeCategoryItems = food;
    } else {
      return res.json({ suggestion: null });
    }

    const itemNames = oppositeCategoryItems.map(item => item.name);

    const prompt = `
      Here is a list of menu items:
      ${itemNames.map(n => `"${n}"`).join(", ")}

      Given the selected item: "${itemName}",
      suggest one single item from the list above that pairs best with it.
      Respond only with the name of the suggested item.
    `;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestionName = aiResponse.choices[0].message.content.trim();

    const matched = oppositeCategoryItems.find(item => item.name === suggestionName);

    if (!matched) {
      return res.json({ suggestion: null });
    }

    return res.json({
      suggestion: {
        id: matched.id,
        name: matched.name,
        price: matched.price,
      }
    });

  } catch (error) {
    console.error("Pairing AI error:", error);
    res.status(500).json({ error: 'Failed to get pairing suggestion' });
  }
});


module.exports = router;
