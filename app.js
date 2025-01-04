const express = require('express');
const pool = require('./db'); // Import the PostgreSQL pool

const app = express();
const port = 8000;

// Middleware
app.use(express.json());

// Route to test the database
app.get('/test', async (req, res) => {
    // try {
    //     const results = await pool.query('SELECT * FROM users');
    //     res.json(results.rows);
    // } catch (err) {
    //     console.error(err.message);

    //     res.status(500).json({ error: 'Database error' });
    // }

    // output the database server called public
    try {
        const results = await pool.query('SELECT * FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);

        res.status(500).json({ error: 'Database error' });
    }
});
app.get('/users', async (req, res) => {
    try {
        // Query to select all users from the 'public' schema
        const result = await pool.query('SELECT * FROM public.users');
        res.json(result.rows); // Send data from users table
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).send('Database query failed');
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
const PORT = 8000;
app.listen(port, () => console.log(`Node app listening on port ${port}!`));