const express = require("express");
const router = express.Router();
const rb = require("@flexsolver/flexrb");
const bcrypt = require("bcrypt");
const qp = require("@flexsolver/flexqp2");
const formatError = require("../../common/error_formatter");

router.post("/", async (req, res, next) => {
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

module.exports = router;
