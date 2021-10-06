var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var cors = require("cors");
const qp = require("@flexsolver/flexqp2");
const rb = require("@flexsolver/flexrb");
const passport = require("passport");
const authenticate = require("./authenticate");
const storage = require("node-persist");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

qp.presetConnection(require(`./dbconfig.json`)); // Setting up connection to mysql
// Setting up cloudinary for file uploads
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

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

//limit file size
app.use(
    bodyParser.urlencoded({
        limit: "500mb",
        extended: true,
        parameterLimit: 50000
    })
);

initStorage();
async function initStorage() {
    await storage.init({ expiredInterval: 1 * 60 * 30 * 1000 }); // run every 30mins to remove expired items
}

/**Account routes */
app.use("/account/register", require("./routes/account/register"));
app.use("/account/login", require("./routes/account/login"));
app.use(`/account/logout`, require(`./routes/account/logout`));
app.use("/account", authenticate.verifyUser, require("./routes/account/account"));
// app.use(`/account/change_password`, authenticate.verifyUser, require(`./routes/account/change_password`));

/**Course routes */
app.use(`/course`, authenticate.verifyUser, require(`./routes/course/course`));

/**Upload routes*/
app.use(`/upload`, require(`./routes/upload/upload`));

server.listen(port, () => {
    console.log(`Server is running on port ${port}!!`);
});
