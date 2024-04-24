import express from 'express';
import cookieParser from 'cookie-parser';
import adminToken from '../../middlewares/admin_token.mjs';
import * as controllers from '../../controllers/teacher/teacher_controller.mjs';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;
const router = express.Router();

router.use(cookieParser(secret));

router.post('/create-account', adminToken(), controllers.createTeacherAccount);
router.get('/teachers-list', adminToken(), controllers.listAllTeachers);
router.get('/teachers-by-career', adminToken(), controllers.teachersByCareer);
router.get('/teachers-export/excel', adminToken(), controllers.exportTeachersExcel);
router.put('/teacher-update-careers', adminToken(), controllers.updateTeacherCareer);
router.delete('/delete-teacher-account/:id', adminToken(),  controllers.deleteTeacher);

export default router;