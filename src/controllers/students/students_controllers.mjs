import { handleServerError } from '../../utils/handle/handle_server.mjs';
import { importStudents } from '../../utils/files/import_students.mjs';
import { exportStudentList } from '../../utils/files/export_student_list.mjs';
import { exportFinalAverageList } from '../../utils/files/export_final_student_list.mjs';

import * as userUtils from '../../utils/user/user_utils.mjs';
import * as studentsUtils from '../../utils/students/students_utils.mjs';
import studentsModel from '../../models/users/students_model.mjs';
import groupModel from '../../models/entities/group_model.mjs';
import subjectsModel from '../../models/entities/subjects_model.mjs';

export const uploadStudentsFromCSV = async(req, res) => {
    try{
        const id = req.body.grupo;
        const file = req.file;

        await importStudents(file, id)
        .then(async (message) => {
            const result = await studentsUtils.updateUnits(id);
            return res.status(200).json({
                success : true,
                message : 'Lista de alumnos guardada',
                result : result
            });
        })
        .catch((error) => {
            return res.status(400).json({
                success : false,
                message : 'Error al guardar la lista de alumnos',
                error : error
            })
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const updateRatings = async(req, res) => {
    try {
        const id = req.body.grupo;
        const newRatings = req.body.alumnos;

        const group = await groupModel.findById(id);
        if(!group){
            return res.status(404).json({
                success: false,
                message: 'Error al buscar el grupo'
            });
        }

        const students = await studentsModel.findById(group.listaAlumnos);
        if(!students){
            return res.status(404).json({
                success: false,
                message: 'Error al consultar la lista de alumnos'
            });
        }

        // Iterar sobre las nuevas calificaciones y actualizar las calificaciones de los estudiantes
        for (const nuevaCalificacion of newRatings) {
            const estudiante = students.alumnos.find(estudiante => estudiante._id.toString() === nuevaCalificacion.idAlumno);
            if (estudiante) {
                for (const calificacion of nuevaCalificacion.calificaciones) {
                    const unidad = estudiante.calificaciones.find(u => u.unidad === calificacion.unidad);
                    if (unidad) {
                        for (const actividad of calificacion.actividades) {
                            const actividadEnUnidad = unidad.actividades.find(act => act.nombreActividad === actividad.nombreActividad); // Se corrigió aquí
                            if (actividadEnUnidad) {
                                actividadEnUnidad.calificacionActividad = actividad.calificacionActividad;
                            }
                        }
                    }
                }
            }
        }

        // Guardar los cambios en la base de datos
        await students.save({ suppressWarning: true });

        await studentsUtils.calculateAverages(id);

        return res.status(200).json({
            success: true,
            message: 'Calificaciones actualizadas y promedios calculados exitosamente',
        });

    } catch(error){
        handleServerError(res, error);
    }
}

export const generateStatistics = async(req, res) => {
    try{    
        
        const groupData = await studentsUtils.calculateGeneralAverages(req.params.id);

        return res.status(200).json({
            success : true,
            group : groupData
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const exportUnitStudentList = async(req, res) => {
    try{    
        const group = await groupModel.findById(req.params.id);
        if(!group){
            return res.status(404).json({
                success : false,
                message : 'GRupo no encontrado'
            });
        }
        const subject = await subjectsModel.aggregate([
            { $unwind: "$materias" },
            { $match: { "materias._id": group.materia  } },
            {
                $project: {
                    _id: "$materias._id",
                    nombreMateria: "$materias.nombreMateria",
                    claveMateria: "$materias.claveMateria",
                    semestreMateria: "$materias.semestreMateria",
                    descripcionMateria: "$materias.descripcionMateria"
                }
            }
        ]);
        const teacher = await userUtils.getUserById(group.docente);
        const students = await studentsModel.findById(group.listaAlumnos);
        const unitNumber = parseInt(req.params.unit);

        const modifiedStudents = students.alumnos.map(student => {
            const calificacionesFiltered = student.calificaciones.filter(cal => cal.unidad === unitNumber);
            return {
                ...student._doc,
                calificaciones: calificacionesFiltered
            };
        });

        const buffer = await exportStudentList(group, subject, teacher, modifiedStudents, unitNumber);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="lista.pdf"',
            'Content-Length': buffer.length
        });
        res.end(buffer); 

        // return res.status(200).json({
        //     success : true,
        //     group : group,
        //     subject : subject,
        //     teacher : teacher,
        //     students : modifiedStudents,
        // });

    }catch(error){
        handleServerError(res, error);
    }
}

export const exportFinalStudentList = async(req, res) => {
    try{    
        const group = await groupModel.findById(req.params.id);
        if(!group){
            return res.status(404).json({
                success : false,
                message : 'GRupo no encontrado'
            });
        }
        const subject = await subjectsModel.aggregate([
            { $unwind: "$materias" },
            { $match: { "materias._id": group.materia  } },
            {
                $project: {
                    _id: "$materias._id",
                    nombreMateria: "$materias.nombreMateria",
                    claveMateria: "$materias.claveMateria",
                    semestreMateria: "$materias.semestreMateria",
                    descripcionMateria: "$materias.descripcionMateria"
                }
            }
        ]);
        const teacher = await userUtils.getUserById(group.docente);
        const students = await studentsModel.findById(group.listaAlumnos);

        const modifiedStudents = students.alumnos.map(student => {
            // Extraemos solo los promedios de unidad de cada conjunto de calificaciones
            const promediosUnidad = student.calificaciones.map(cal => cal.promedioUnidad);
        
            // Creamos un nuevo objeto sin la propiedad 'calificaciones'
            const studentData = {
                nombre: student.nombre,
                numeroControl: student.numeroControl,
                promedioFinal: student.promedioFinal,
                _id: student._id,
                promediosUnidad: promediosUnidad  // Agregamos los promedios de unidad como un nuevo array
            };
        
            return studentData;
        });
        

        const buffer = await exportFinalAverageList(group, subject, teacher, modifiedStudents);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="promedios.pdf"',
            'Content-Length': buffer.length
        });
        res.end(buffer); 

        // return res.status(200).json({
        //     success : true,
        //     group : group,
        //     subject : subject,
        //     teacher : teacher,
        //     students : modifiedStudents,
        // });

    }catch(error){
        handleServerError(res, error);
    }
}