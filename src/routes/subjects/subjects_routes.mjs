import * as controllers from '../../controllers/subjects/subjects_controllers.mjs';
import authToken from '../../middlewares/auth_token.mjs';
import adminToken from '../../middlewares/admin_token.mjs';

import express from 'express';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;
const upload = multer();
const router = express.Router();

router.use(cookieParser(secret));
router.post('/upload-subjects', upload.single('file'), adminToken(), controllers.uploadSubjectsFromCSV);
router.get('/subjects-by-career', authToken(), controllers.subjectsByCareer);
router.get('/subjects-keys-career', authToken(), controllers.keySubjectsByCareer);
router.get('/subjects-by-careers-and-period/:period', authToken(), controllers.subjectsByCareersAndPeriod);

export default router;