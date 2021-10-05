const express = require("express");
const router = express.Router();
const rb = require("@flexsolver/flexrb");
const storage = require("node-persist");


router.post("/", async (req, res, next) => {
    await storage.clear();
    res.send(rb.build("Logout successful!"));
});

module.exports = router;