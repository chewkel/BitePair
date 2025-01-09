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

app.use(
    session({
        secret: "somerandomstuff",
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 600000,
        },
    })
);

// Middleware
app.use(express.json());

const mainRoutes = require("./routes/main");
app.use("/", mainRoutes);

const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

const menuRouter = require('./routes/menu');
app.use('/menu', menuRouter);

const basketRouter = require('./routes/basket');
app.use('/basket', basketRouter);

// Start the server
const PORT = 8000;
app.listen(port, () => console.log(`Node app listening on port ${port}!`));