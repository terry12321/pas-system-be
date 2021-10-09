const express = require("express");
const router = express.Router();
const passport = require("passport");
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");
const qp = require("@flexsolver/flexqp2");

var itemRouter = express.Router({ mergeParams: true });
router.use('/:courseId', itemRouter);

//get all courses
router.get("/", async (req, res, next) => {
    try{
        var course = await qp.select(`SELECT * FROM course`);
        qp.select
        //console.log(course);
    }catch(error){
        res.status(500).json(formatError(500, error.message));
    }
    res.send(course);
});//END

//GET 1 specific course
router.get("/:courseId", async (req, res, next) => {
    const course = req.params;
    try {
        var coursedetail = await qp.selectFirst(`SELECT * FROM course WHERE course_id = ?`, [course.courseId]);
        console.log(coursedetail)
    } catch (error) {
        res.status(500).json(formatError(500, error.message));
    }
    res.send(coursedetail);
});//END

module.exports = router;
