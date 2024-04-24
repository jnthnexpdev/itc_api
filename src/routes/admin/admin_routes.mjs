import * as controllers from '../../controllers/admin/admin_controllers.mjs';
import adminToken from '../../middlewares/admin_token.mjs';

import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.SECRET;
const router = express.Router();

router.use(cookieParser(secret));
router.post('/create-account', adminToken(),  controllers.createAdminAccount);
router.get('/list-all-admins', adminToken(),  controllers.listAllAdmins);
router.delete('/delete-admin-account/:id', adminToken(),  controllers.deleteAdmin);

export default router;