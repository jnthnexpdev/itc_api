import * as controllers from '../../controllers/period/period_controllers.mjs';
import authToken from '../../middlewares/auth_token.mjs';
import adminToken from '../../middlewares/admin_token.mjs';

import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;
const router = express.Router();

router.use(cookieParser(secret));
router.post('/period-register', adminToken(), controllers.createPeriod);
router.get('/period-descriptions', authToken(), controllers.descriptionPeriodsByCareers);
router.get('/period-careers', authToken(), controllers.periodsByCareer);
router.get('/period-export/excel', authToken(), controllers.exportPeriodsByCareerPDF);

export default router;