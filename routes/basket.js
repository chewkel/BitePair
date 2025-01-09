const express = require('express');
const pool = require('../db');
const { render } = require('ejs');
const router = express.Router();

router.get("/", (req, res) => {
    if (!req.session.basket) {
        req.session.basket = { items: [] };
    }

    const basket = req.session.basket.items || [];
    const total = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.render("basket.ejs", { basket, total });
});

router.post("/add", (req, res) => {
    const { itemId, category, name, price, quantity } = req.body;

    if (!req.session.basket) {
        req.session.basket = [];
    }

    const existingItem = req.session.basket.find(item => item.id === itemId && item.category === category);

    if (existingItem) {
        existingItem.quantity += parseInt(quantity, 10);
    } else {
        req.session.basket.push({ id: itemId, category, name, price, quantity: parseInt(quantity, 10) });
    }

    res.redirect("/menu");
});

router.post("/update", (req, res) => {
    const { id, category, change } = req.body;

    if (!req.session.basket) {
        req.session.basket = { items: [], total: 0 };
    }
    const basket = req.session.basket;

    if (!Array.isArray(basket.items)) {
        basket.items = [];
    }

    const itemIndex = basket.items.findIndex(
        (item) => item.id == id && item.category === category
    );

    if (itemIndex > -1) {
        if (change === 0) {
            basket.items.splice(itemIndex, 1);
        } else {
            basket.items[itemIndex].quantity += change;
            if (basket.items[itemIndex].quantity <= 0) {
                basket.items.splice(itemIndex, 1);
            }
        }
    } else if (change > 0) {
        const newItem = {
            id: id,
            category: category,
            name: "Fetched Item Name",
            price: 10.99,
            quantity: 1
        };
        basket.items.push(newItem);
    }

    basket.total = basket.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    res.json({
        success: true,
        basket: basket,
        message: "Basket updated successfully."
    });
});

module.exports = router;
