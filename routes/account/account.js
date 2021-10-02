const express = require("express");
const router = express.Router();
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");
const qp = require("@flexsolver/flexqp2");
const bcrypt = require("bcrypt");
const storage = require("node-persist");

router.post("/relogin", async (req, res, next) => {
    const user = req.user;
    let get_updated_user;
    let token = req.headers.authorization;
    token = token.replace(`Bearer `, ""); //get token

    try {
        //check if req.user is null
        if (user !== null) {
            get_updated_user = await qp.selectFirst(`SELECT * FROM account WHERE id = ?`, [user.id]);
            delete get_updated_user.password; //remove password
        }

        let new_token = authenticate.getToken(); //resign and get new token
        await storage.setItem(new_token, get_updated_user, { ttl: 60 * 10 }); //stores user in local storage
        await storage.removeItem(token); //remove old token in local storage

        let result = {
            token: new_token,
            ttl: 60 * 10
        };

        res.json(rb.build(result));
    } catch (error) {
        res.status(500).json(formatError(500, error.message));
    }
});

router.post("/change_password", async (req, res, next) => {
    let con;
    try {
        con = await qp.connectWithTbegin();
        const body = req.body;
        const user = req.user;
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(body.password, salt);
        const result = await qp.run(`UPDATE account SET password = ? WHERE id = ?`, [hash, user.id]);
        await qp.commitAndCloseConnection(con);
        res.send(rb.build(result, "Password changed successfully!"));
    } catch (error) {
        if (con) {
            await qp.rollbackAndCloseConnection(con);
        }
        res.status(406).send(formatError(error.status, error.message));
    }
});

router.post("/logout", async (req, res, next) => {
    await storage.clear();
    res.send(rb.build("Logout successful!"));
});

module.exports = router;
