const express = require("express");
const pool = require("../db");
const { render } = require("ejs");
const router = express.Router();

router.get("/", (req, res) => {
  const basket = req.session.basket || [];
  const total = basket.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  console.log(basket);
  res.render("basket", { basket, total });
});

router.post("/add", (req, res) => {
  const { id, name, price } = req.body;

  if (!req.session.basket) {
    req.session.basket = [];
  }

  let item = req.session.basket.find((item) => item.id === id);

  if (item) {
    item.quantity += 1;
  } else {
    req.session.basket.push({ id, name, price, quantity: 1 });
  }

  res.json({ success: true, basket: req.session.basket });
});

router.post("/update", (req, res) => {
  const { id, change } = req.body;
  if (!req.session.basket) req.session.basket = [];

  let item = req.session.basket.find((item) => item.id === id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      req.session.basket = req.session.basket.filter((i) => i.id !== id);
    }
    res.json({ success: true, newQuantity: item.quantity });
  } else {
    res.json({ success: false, message: "Item not found in basket" });
  }
});

router.post("/remove", (req, res) => {
  const { id } = req.body;
  req.session.basket = req.session.basket.filter((item) => item.id !== id);
  res.json({ success: true, basket: req.session.basket });
});

module.exports = router;
