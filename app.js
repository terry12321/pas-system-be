var mysql = require("mysql");
var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var cors = require("cors");
const qp = require("@flexsolver/flexqp2");
const rb = require("@flexsolver/flexrb");
const passport = require("passport");
const authenticate = require("./authenticate");
const storage = require("node-persist");

qp.presetConnection(require(`./dbconfig.json`)); // Setting up connection to mysql

/**Set up server to http and use express */
var port = process.env.PORT || 4000;
var app = express();
var server = http.createServer(app);
var corsOptions = {
    origin: "http://localhost:8080"
};

/**Initialise necessary npm(s)*/
rb.setQpDriver(qp);
app.use(express.json());
app.use("/assets", express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(cors(corsOptions)); // parse requests of content-type - application/x-www-form-urlencoded
require("./authenticate"); //Need to require the authenticate module so that app.js knows about it
app.use(passport.initialize());
app.use(passport.session());

initStorage();
async function initStorage() {
    await storage.init({ expiredInterval: 1 * 60 * 60 * 1000 }); // run every hour to remove expired items
}

/**Account routes */
app.use("/account/register", require("./routes/account/register"));
app.use("/account/login", require("./routes/account/login"));
app.use(`/account/relogin`, authenticate.verifyUser, require(`./routes/account/relogin`));

/**Course routes */
app.use(`/course`, authenticate.verifyUser, require(`./routes/course/course`));

server.listen(port, () => {
    console.log(`Server is running on port ${port}!!`);
});
