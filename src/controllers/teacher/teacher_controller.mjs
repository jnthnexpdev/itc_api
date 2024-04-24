import teacherModel from '../../models/users/teacher_model.mjs';
import { handleServerError } from '../../utils/handle/handle_server.mjs';
import * as userUtils from '../../utils/user/user_utils.mjs';
import { getDateAndTime } from '../../utils/date/date_utils.mjs';
import { exportTeachers } from '../../utils/files/export_teachers.mjs';

export const createTeacherAccount = async (req, res) => {
    try{
        const body = req.body;
        const id = await userUtils.getUserIdFromCookie(req);
        const admin = await userUtils.getUserById(id);
        const { fecha, hora } = await getDateAndTime();

        //Docente registrado 
        const existingTeacherSameCareer  = await teacherModel.findOne({correo : body.correo, 'carreras.carrera' : {$in : admin.carrera} });
        if(existingTeacherSameCareer ){
            return res.status(400).json({
                success : false,
                message : 'Este docente ya tiene una cuenta'
            });
        }

        //Docente registrado en otra ingenieria
        const existingTeacherOtherCareer  = await teacherModel.findOne({correo : body.correo});
        if(existingTeacherOtherCareer ){
            return res.status(200).json({
                success : false,
                duplicate : true,
                message: 'Correo registrado en otra cuenta de una ingeniería diferente'
            });
        }

        const careers = Array.isArray(admin.carrera) ? admin.carrera : [admin.carrera];

        const teacher = new teacherModel({
            nombre : body.nombre,
            correo : body.correo,
            cuenta : 'Docente',
            carreras : careers.map(career => ({ carrera : career})),
            fechaRegistro : fecha,
            horaRegistro : hora,
            password : body.password,
            sesion : {
                ultimaSesion : '',
                codigoAcceso : '',
                validezCodigoAcceso : false,
            }
        });

        await teacher.save();

        return res.status(200).json({
            success : true,
            message : 'Docente registrado'
        });
    }catch(error){
        handleServerError(res, error);
    }
}

export const listAllTeachers = async(req, res) => {
    try{
        const teachers = await teacherModel.find().select('-password');

        if(teachers.length === 0 || teachers === null){
            return res.status(400).json({
                success : false,
                message : 'Aun no hay docentes registrados en el sistema'
            });
        }

        return res.status(200).json({
            success : true,
            teachers : teachers
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const teachersByCareer = async(req, res) => {
    try{
        const searchQuery = req.query.search;
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);

        let searchConditions = {
            'carreras.carrera': {$in: user.carrera}
        };

        if (searchQuery) {
            searchConditions['$or'] = [
                {'nombre': {$regex: searchQuery, $options: 'i'}},
                {'correo': {$regex: searchQuery, $options: 'i'}}
            ];
        }

        const teachers = await teacherModel.find(searchConditions).select('-password');

        if(teachers.length === 0 || teachers === null){
            return res.status(400).json({
                success : false,
                message : 'Aun no hay docentes registrados en el sistema'
            });
        }

        return res.status(200).json({
            success : true,
            teachers : teachers
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const updateTeacherCareer = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const admin = await userUtils.getUserById(id);
        const teacher = await userUtils.getUserByEmail(req.body.correo);

        if(!teacher){
            return res.status(404).json({
                success : false,
                message : 'El correo no esta asociado a ninguna cuenta'
            });
        }

        await teacherModel.findByIdAndUpdate(teacher._id, { $push : { carreras : { carrera : admin.carrera } } },
            { new: true }
        );

        return res.status(200).json({
            success : true,
            message : 'Docente actualizado'
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const exportTeachersExcel = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const admin = await userUtils.getUserById(id);

        const teachers = await teacherModel.find({
            'carreras.carrera' : admin.carrera
        }).select('-password');
        
        const buffer = await exportTeachers(teachers, admin.carrera);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="docentes.pdf"',
            'Content-Length': buffer.length
        });
        res.end(buffer); 

    }catch(error){
        handleServerError(res, error);
    }
}

export const deleteTeacher = async(req, res) => {
    try{
        const id = req.params.id;
        const user = await userUtils.getUserById(id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : 'Usuario no eliminado, debido a que no existe'
            });
        }

        await teacherModel.findByIdAndDelete(user.id);

        return res.status(200).json({
            success : true,
            message : 'Docente eliminado'
        });

    }catch(error){
        handleServerError(res, error);
    }
}