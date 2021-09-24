const express = require("express");
const router = express.Router();
const passport = require("passport");
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");
const storage = require("node-persist");
const qp = require("@flexsolver/flexqp2");

router.post("/", async (req, res, next) => {
    const user = req.user;
    let get_updated_user;
    let token = req.headers.authorization;
    token = token.replace(`Bearer `, ""); //get token

    //check if req.user is null
    if (user !== null) {
        get_updated_user = await qp.selectFirst(`SELECT * FROM account WHERE id = ?`, [user.id]);
        delete get_updated_user.password; //remove password
    }

    let new_token = authenticate.getToken(); //resign and get new token
    await storage.setItem(new_token, get_updated_user, { ttl: 60 * 10 }); //stores user in local storage
    await storage.removeItem(token); //remove old token in local storage

    let result = {
        token,
        ttl: 60 * 10
    };

    res.json(rb.build(result));
});

module.exports = router;
