const bcrypt = require("bcrypt");
const qp = require("@flexsolver/flexqp2");
const express = require(`express`);
const router = express.Router();
const rb = require("@flexsolver/flexrb");
const createError = require("http-errors");
const formatError = require("../../common/error_formatter");

router.post("/", async (req, res, next) => {
    let con;
    try {
        con = await qp.connectWithTbegin();

        const body = req.body;
        //check if user exists already
        const exist = await qp.scalarFirst(`SELECT COUNT(*) FROM account WHERE username = ?`, [body.username], con);
        if (exist && exist > 0) {
            throw createError(406, "Duplicate Account!");
        }
        if(!body.name || body.name === null){
            throw createError(500, "Please add a name!");
        }
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(body.password, salt);
        //Data access object
        let dao = {
            username: body.username.toLowerCase(),
            password: hash,
            name: body.name
        };
        const result = await qp.run(`INSERT INTO account SET ?`, [dao], con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(result, "Account registered successfully!"));
    } catch (error) {
        if (con) {
            await qp.rollbackAndCloseConnection(con);
        }
        res.status(406).send(formatError(error.status, error.message));
    }
});

module.exports = router;
