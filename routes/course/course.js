const express = require("express");
const router = express.Router();
const passport = require("passport");
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");

router.get("/", async (req, res, next) => {
    // const body = req.body;
    // console.log(body);
    res.send("hi");
});

module.exports = router;
