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
                res.status(500).send(formatError(err.message, 500));
            } else {
                res.status(err.status).send(formatError(err.message, err.status));
            }
        }
        if (user) {
            let token = authenticate.getToken();
            let result = {
                token
            };

            //Use token as the key and user as the value
            //stores user in local storage
            await storage.setItem(token, user, { ttl: 12 * 60 * 60 * 1000 });

            res.json(rb.build(result));
        }
    })(req, res, next);
});

module.exports = router;
