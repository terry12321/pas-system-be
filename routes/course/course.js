const express = require("express");
const router = express.Router();
const passport = require("passport");
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");
const qp = require("@flexsolver/flexqp2");


//get all courses
router.get("/", async (req, res, next) => {
    try{
        var course = await qp.select(`SELECT * FROM course`);
        res.json(rb.build(course));
        //console.log(course);
    }catch(error){
        res.status(500).json(formatError(500, error.message));
    }
});//END

//GET all courses with based on school
router.post("/", async (req, res, next) => {
    try{
        var course = await qp.select(`SELECT * FROM course WHERE school_id = ?`,[req.body.school_id]);
        res.json(rb.build(course));
        //console.log(course);
    }catch(error){
        res.status(500).json(formatError(500, error.message));
    }
});//END

//GET 1 specific course
router.post("/get_one_course", async (req, res, next) => {
    const course = req.body;
    try {
        var coursedetail = await qp.selectFirst(`SELECT * FROM course c join school s on c.school_id = s.school_id WHERE course_id = ?`, [course.course_id]);
        res.json(rb.build(coursedetail));
    } catch (error) {
        res.status(500).json(formatError(500, error.message));
    }
});//END

//GET course data in a certain format for compare page
router.get('/compare_course_data', async(req,res,next)=>{
    try{
        const result = await qp.select(
            `
            SELECT 
                s.school_name,
                JSON_ARRAYAGG(JSON_OBJECT('value',
                                c.course_id,
                                'label',
                                c.course_name)) AS courses
            FROM
                school s
                    LEFT JOIN
                course c ON s.school_id = c.school_id
            GROUP BY s.school_name
            ORDER BY s.school_id`
        );
        res.json(rb.build(result));
    }catch(error){
        res.status(500).json(formatError(500, error.message));
    }
})//END

//Register courses for student
router.post('/register_course', async(req,res,next)=>{
    let con;
    try{
        con = await qp.connectWithTbegin();
        user = req.user;
        const body = req.body;
        var promise_list = [];
        if(body){
            //before we insert we should remove previous choices
            await qp.run('DELETE FROM student_choice WHERE student_id = ?',[user.id],con);
            for(const eachChoice of body.choices){
                var dao = {
                    student_id: user.id,
                    student_choice: eachChoice.choice,
                    course_id: eachChoice.course_code,
                    school_id: eachChoice.schoolSel ? eachChoice.schoolSel : null
                }
                promise_list.push(qp.run(`INSERT INTO student_choice SET ?`,[dao],con));
            }
            await Promise.all(promise_list);
        }
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(`Successfully inserted!`));
    }catch(error){
        if(con){
            await qp.rollbackAndCloseConnection(con);
        }
        res.status(500).json(formatError(500, error.message));
    }
})//END

//get saved/submit courses for student
router.get('/register_course', async(req,res,next)=>{
    let con;
    try{
        con = await qp.connectWithTbegin();
        user = req.user;
        const result = await qp.select(`SELECT * FROM student_choice where student_id = ?`,[user.id],con);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build(result));
    }catch(error){
        if(con){
            await qp.rollbackAndCloseConnection(con);
        }
        res.status(500).json(formatError(500, error.message));
    }
})//END

module.exports = router;
