import * as controllers from '../../controllers/auth/auth_controllers.mjs';
import authToken from '../../middlewares/auth_token.mjs';

import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;
const router = express.Router();

router.use(cookieParser(secret));
router.post('/login', controllers.loginUser);
router.post('/access-code/generate', controllers.generateAccessCode);
router.post('/access-code/validate', controllers.validateAccessCode);
router.get('/account-type', authToken(), controllers.identifyUserType);
router.get('/info', authToken(), controllers.infoUser);
router.get('/is-logged', controllers.authUser);

export default router;