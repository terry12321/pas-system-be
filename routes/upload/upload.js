const express = require("express");
const router = express.Router();
const formatError = require("../../common/error_formatter");
const rb = require("@flexsolver/flexrb");
const Formidable = require("formidable");
const cloudinary = require("cloudinary").v2;

router.post("/", (req, res, next) => {
    const form = new Formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
        cloudinary.uploader.upload(files, { html: { multiple: 1 } }, (error, result) => {
            // output after the code is executed in terminal and browser
            // successful output: metadata of file one after the other (name, type, size, etc)
            console.log(result);
            if (result) {
                res.json(rb.build({}, "File Uploaded Succesfully"));
            } else {
                res.json(rb.buildError("file upload failed!", 500, error));
            }
        });
    });
    return;
});

module.exports = router;
