const express = require("express");
const router = express.Router();
const formatError = require("../../common/error_formatter");
const authenticate = require("../../authenticate");
const rb = require("@flexsolver/flexrb");
const qp = require("@flexsolver/flexqp2");
const bcrypt = require("bcrypt");
const storage = require("node-persist");
const createHttpError = require("http-errors");

var itemRouter = express.Router({ mergeParams: true });
router.use('/:studentId', itemRouter);

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
            ttl: 60 * 10,
            user: {
                id : get_updated_user.id,
                name : get_updated_user.name
            }
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
        const user_data = await qp.selectFirst(`SELECT * FROM account WHERE id = ?`, [user.id]);
        const match = bcrypt.compareSync(body.current_password, user_data.password);
        let result;
        if(match){
            const salt = await bcrypt.genSalt();
            const hash = await bcrypt.hash(body.password, salt);
            result = await qp.run(`UPDATE account SET password = ? WHERE id = ?`, [hash, user.id],con);
        }else{
            throw new createHttpError(406,'Current password is incorrect!');
        }
        await qp.commitAndCloseConnection(con);
        res.send(rb.build(result, "Password changed successfully!"));
    } catch (error) {
        if (con) {
            await qp.rollbackAndCloseConnection(con);
        }
        res.status(406).send(formatError(error.status, error.message));
    }
});

//GET 1 specific student
router.get("/:studentId", async (req, res, next) => {
    const studentId = req.params.studentId;
    try {
        var studentdetails = await qp.selectFirst(
            `SELECT 
                *,
                (SELECT 
                        JSON_ARRAYAGG(JSON_OBJECT('subject_id',
                                            sg.subject_id,
                                            'grade',
                                            sg.grade))
                    FROM
                        student_grades sg
                            INNER JOIN
                        account a ON sg.student_id = a.id
                    WHERE
                        a.id = ?) AS grades
            FROM
                account a
                    LEFT JOIN
                student_document sd ON a.id = sd.student_id
            WHERE
                a.id = ?`, [studentId, studentId]);
        // var grades = await qp.select(`SELECT subject_id, grade FROM student_grades WHERE student_id = ?`,[studentId]);
        // studentdetails.grades = grades;
        res.json(rb.build(studentdetails));
        
    } catch (error) {
        res.status(500).json(formatError(500, error.message));
    }
});//END


//Update student details
router.put(`/:studentId`, async(req,res,next)=>{
    const body = req.body;
    const id = req.params.studentId;
    const {grades,...dto} = body;
    let con;
    try {
        con = await qp.connectWithTbegin();
        const acc_result = await qp.run(`UPDATE account SET ? WHERE id = ?`,[dto,id],con);
        //delete student_grades and re-add them
        await qp.run(`DELETE FROM student_grades WHERE student_id = ?`,[id],con);
        let promise_list = [];
        if(acc_result){
            for(const eachGrade of grades){
                let student_grade_dto = {
                    student_id : id,
                    subject_id : eachGrade.subject_id,
                    grade : eachGrade.grade
                }
                promise_list.push(qp.run(`INSERT INTO student_grades SET ?`,[student_grade_dto],con));
            }
        }
        await Promise.all(promise_list);
        await qp.commitAndCloseConnection(con);
        res.json(rb.build('Succesfully updated user!'));
    } catch (error) {
        if(con){
            await qp.rollbackAndCloseConnection(con);
        }
        let status = error.status? error.status : 500;
        res.status(status).send(formatError(status, error.message));
    }
})

module.exports = router;
