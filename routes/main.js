const express = require("express");
const router = express.Router();

// This shows the main home page
router.get("/", function (req, res, next) {
    res.render("index.ejs");
});

module.exports = router;
