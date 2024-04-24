import admin from './admin/admin_routes.mjs';
import auth from './auth/auth_routes.mjs';
import teacher from './teacher/teacher_routes.mjs';
import period from './period/period_routes.mjs';
import subjects from './subjects/subjects_routes.mjs';
import group from './group/group_routes.mjs';
import students from './students/students_routes.mjs';

import express from 'express';
const router = express.Router();

router.use('/api/v1/itc/auth', auth);
router.use('/api/v1/itc/admin', admin);
router.use('/api/v1/itc/teacher', teacher);
router.use('/api/v1/itc/students', students);
router.use('/api/v1/itc/group', group);
router.use('/api/v1/itc/subjects', subjects);
router.use('/api/v1/itc/period', period);

export default router;