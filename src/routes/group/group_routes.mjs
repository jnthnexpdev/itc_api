import * as controllers from '../../controllers/group/group_controllers.mjs';
import teacherToken from '../../middlewares/teacher_token.mjs';

import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;
const upload = multer();
const router = express.Router();

router.use(cookieParser(secret));

router.post('/create-group', teacherToken(), controllers.createGroup);
router.post('/generate-report/:id', upload.array('files') , controllers.generateReport);
router.get('/all-groups-teacher', teacherToken(), controllers.allGroups);
router.get('/export-groups-by-teacher', teacherToken(), controllers.exportGroupsByTeacher);
router.get('/info-group/:id', teacherToken(), controllers.infoGroup);
router.get('/info-group-units/:id', teacherToken(), controllers.unitsGroup);

export default router;