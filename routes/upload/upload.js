const express = require("express");
const router = express.Router();
const formatError = require("../../common/error_formatter");
const rb = require("@flexsolver/flexrb");
const Formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const qp = require("@flexsolver/flexqp2");
const fs = require("fs");
const multer = require("multer");

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

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

//upload.array(fieldname,[maxCount])
router.post("/multiple", upload.array("files", 12), async (req, res, next) => {
    // req.files is array of `files` files
    // req.body will contain the text fields,
    // if there were any
    // let con;
    try {
        // con = await qp.connectWithTbegin();
        let imageUrlList = [];
        // let daoList = [];
        for (let i = 0; i < req.files.length; i++) {
            const locaFilePath = req.files[i].path;

            // Upload the local image to Cloudinary
            // and get image url as response
            const result = await uploadToCloudinary(locaFilePath);
            if (result.message === "Fail") {
                throw new Error(result.error_message);
            }
            imageUrlList.push(result.url);
            // if (result.url) {
            //     let dao = {
            //         student_id: req.user.id,
            //         document_url: result.url
            //     };
            //     daoList.push(await qp.run(`INSERT INTO student_document SET ?`, [dao], con));
            // }
        }

        res.json(rb.build(imageUrlList, "Files Upload Successful!"));
    } catch (error) {
        // if (con) {
        //     await qp.rollbackAndCloseConnection(con);
        // }
        res.send(rb.buildError(error));
    }
});

async function uploadToCloudinary(locaFilePath) {
    // locaFilePath: path of image which was just
    // uploaded to "uploads" folder

    var mainFolderName = "main";
    // filePathOnCloudinary: path of image we want
    // to set when it is uploaded to cloudinary
    var filePathOnCloudinary = mainFolderName + "/" + locaFilePath;

    return cloudinary.uploader
        .upload(locaFilePath, { folder: "swe_uploads" })
        .then((result) => {
            // Image has been successfully uploaded on
            // cloudinary So we dont need local image
            // file anymore
            // Remove file from local uploads folder
            fs.unlinkSync(locaFilePath);

            return {
                message: "Success",
                url: result.url
            };
        })
        .catch((error) => {
            // Remove file from local uploads folder
            fs.unlinkSync(locaFilePath);
            return { message: "Fail", error_message: error.message };
        });
}

module.exports = router;
