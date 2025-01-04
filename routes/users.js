const express = require('express');
const pool = require('../db');
const router = express.Router();




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









module.exports = router;
