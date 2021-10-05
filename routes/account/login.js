const express = require("express");
const router = express.Router();
const passport = require("passport");
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");
const storage = require("node-persist");

router.post("/", (req, res, next) => {
    passport.authenticate("local", async (err, user) => {
        if (err) {
            if (!err.status) {
                res.status(500).send(formatError(500, err.message));
            } else {
                res.status(err.status).send(formatError(err.status, err.message));
            }
        }
        if (user) {
            let token = authenticate.getToken();
            let result = {
                token,
                ttl: 60 * 30,
                first_login: user.first_login,
                name: user.name
            };

            //Use token as the key and user as the value
            //stores user in local storage
            await storage.setItem(token, user, { ttl: 60 * 30 });

            res.json(rb.build(result));
        }
    })(req, res, next);
});

module.exports = router;
