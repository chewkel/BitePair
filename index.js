const express = require('express');
const pool = require('./db'); // Import the PostgreSQL pool
const router = express();
var ejs = require('ejs');
var session = require('express-session');

const app = express();
const port = 8000;

var validator = require('validator');
const expressSanitizer = require('express-sanitizer');

// Tell Express that we want to use EJS as the templating engine
app.set("view engine", "ejs");

// Set up the body parser
app.use(express.urlencoded({ extended: true }));

// Set up public folder (for css and statis js)
app.use(express.static(__dirname + "/public"));

app.use(expressSanitizer());

// Middleware
app.use(express.json());

app.get('/test', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
        res.json(results.rows);
    } catch (err) {
        console.error(err.message);

        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

// Start the server
const PORT = 8000;
app.listen(port, () => console.log(`Node app listening on port ${port}!`));