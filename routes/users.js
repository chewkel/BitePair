const express = require('express');
const pool = require('../db');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const redirectLogin = (req, res, next) => {
    if (!req.session.userId) {
        res.redirect("./login");
    } else {
        next();
    }
};

const { check, validationResult } = require("express-validator");
const { get } = require("request");
// const { render } = require("pug");

router.get('/users', async (req, res) => {
    try {
        // Query to select all users from the 'public' schema
        const result = await pool.query('SELECT * FROM public.users');
        res.json(result.rows); // Send data from users table
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).send('Database query failed');
    }
});

router.get("/register", (req, res) => {
    res.render("register.ejs");
});

router.post("/registered", [
    check("username").isLength({ min: 3 }),
    check("email").isEmail(),
    check("password").isLength({ min: 5 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    let username = req.sanitize(req.body.username);
    let email = req.sanitize(req.body.email);
    let hashedPassword = req.sanitize(req.body.password);
    let created_at = new Date();

    try {
        const user = await pool.query('SELECT * FROM public.users WHERE username = $1', [username]);
        if (user.rows.length > 0) {
            res.send("Username already exists");
        } else {
            bcrypt.hash(hashedPassword, saltRounds, async (err, hashedPassword) => {
                const newUser = await pool.query('INSERT INTO public.users (username, email, hashedPassword, created_at) VALUES ($1, $2, $3, $4)', [username, email, hashedPassword, created_at]);
                res.send("User registered successfully! <a href=" + "../" + ">Home</a>");
            });
        }
    } catch (err) {
        console.error('Error registering user:', err.message);
        res.status(500).send('Database query failed');
    }

});

router.get("/login", (req, res) => {
    res.render("login.ejs");
});

router.post("/loggedin", async (req, res) => {
    let username = req.sanitize(req.body.username);
    let password = req.sanitize(req.body.password);

    try {
        const user = await pool.query('SELECT * FROM public.users WHERE username = $1', [username]);
        if (user.rows.length > 0) {
            bcrypt.compare(password, user.rows[0].hashedpassword, (err, result) => {
                if (result) {
                    res.send("Login successful! <a href=" + "../" + ">Home</a>");
                } else {
                    res.send("Incorrect password");
                }
            });
        } else {
            res.send("User does not exist");
        }
    } catch (err) {
        console.error('Error logging in:', err.message);
        res.status(500).send('Database query failed');
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect("./");
        }
        res.clearCookie("sid");
        res.redirect("./");
    });
});

router.get("/profile", redirectLogin, (req, res) => {
    res.send("Profile page");
});

router.get("edit", redirectLogin, (req, res) => {
    const { userId } = req.session;

    const user = pool.query('SELECT * FROM public.users WHERE id = $1', [userId]);
    res.render("edit.ejs", { user });
}
);




module.exports = router;
