const rb = require("@flexsolver/flexrb");
const passport = require("passport");
const formatError = require("../../common/error_formatter");
const express = require("express");
const router = express.Router();
const authenticate = require("../../authenticate");

router.post("/", (req, res, next) => {
    passport.authenticate("local", (err, user) => {
        if (err) {
            res.status(err.status).send(formatError(err.message, err.status));
        }
        if (user) {
            let token = authenticate.getToken(user);
            let result = {
                user,
                token
            };
            res.json(rb.build(result));
        }
    })(req, res, next);
});

module.exports = router;
