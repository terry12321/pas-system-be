var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var cors = require("cors");

// random comment

/**Get all the routes */
const login = require('./routes/login');

/**Set up server to http and use express */
var port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var corsOptions = {
    origin: "http://localhost:8080"
};


/**Initialise necessary npm(s)*/
app.use(bodyParser.json());
app.use('/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

/** Setting up connection to mysql */
var mysqlConnection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})

app.post("/login", login);


server.listen(port, () => {
    console.log(`Server is running on port ${port}!!`);
});