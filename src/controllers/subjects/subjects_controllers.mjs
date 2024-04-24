import { handleServerError } from '../../utils/handle/handle_server.mjs';
import { importSubjects } from '../../utils/files/import_subjects.mjs';
import * as userUtils from '../../utils/user/user_utils.mjs';
import subjectsModel from '../../models/entities/subjects_model.mjs';
import periodModel from '../../models/entities/period_model.mjs';

export const uploadSubjectsFromCSV = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);

        const file = req.file;
        const career = user.carrera;
        const key = req.body.claveReticula;

        await importSubjects(file, key, career)
        .then((message) => {
            return res.status(200).json({
                success : true,
                message : 'Reticula guardada'
            });
        })
        .catch((error) => {
            return res.status(400).json({
                success : false,
                message : 'Error al guardar la reticula',
                error : error
            })
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const subjectsByCareer = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);
        const subjects = await subjectsModel.find({ 'carrera' : user.carrera });

        return res.status(200).json({
            success : true,
            subjects : subjects
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const keySubjectsByCareer = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);

        const subjects = await subjectsModel.find({
            'carrera' : user.carrera
        }).select('_id claveReticula');

        return res.status(200).json({
            success : true,
            subjects : subjects
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const subjectsByCareersAndPeriod = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);
        const period = req.params.period;
        let careers = '';

        if(user.cuenta === 'Administrador'){
            careers = [user.carrera]
        }else if(user.cuenta === 'Docente'){
            careers = user.carreras.map(career => career.carrera);
        }

        const idSubjects = await periodModel.find({ 'carrera': { $in: careers }, 'periodo' : period }).select('idReticula');
        const subjects = await subjectsModel.find({_id : {$in : idSubjects.map(subject => subject.idReticula)}});

        return res.status(200).json({
            success: true,
            subjects: subjects
        });

    }catch(error){
        handleServerError(res, error);
    }
}