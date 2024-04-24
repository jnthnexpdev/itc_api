import studentsModel from '../../models/users/students_model.mjs';
import groupModel from '../../models/entities/group_model.mjs';

export async function updateUnits(id){
    try{
        // Obtener el id del grupo y buscar la información
        const group = await groupModel.findById(id);
        if(!group){
            console.error('Error al buscar el grupo');
        }

        const students = await studentsModel.findById(group.listaAlumnos);

        students.alumnos.forEach(student => {
            student.calificaciones = [];

            group.unidades.forEach(unit => {
                const activities = unit.actividades.map(activity => {
                    return {
                        nombreActividad: activity.nombre,
                        calificacionActividad: 0,
                    };
                });

                student.calificaciones.push({
                    unidad: unit.unidad,
                    actividades: activities,
                    promedioUnidad: 0
                });
            });
        });

        await students.save();

        // Devuelve los datos actualizados
        return {
            success: true,
            message: 'Información actualizada',
            group: group,
            students: students
        };

    } catch(error){
        console.log(error);
        throw error;
    }
}

export async function calculateAverages(id){
    try {
        const group = await groupModel.findById(id);
        if (!group) {
            throw new Error('El grupo no existe');
        }

        const students = await studentsModel.findById(group.listaAlumnos);
        if (!students) {
            throw new Error('La lista de alumnos no existe');
        }

        let totalPromedioFinal = 0; // Variable para almacenar la suma de los promedios de todas las unidades

        // Iterar sobre cada alumno
        for(const alumno of students.alumnos){
            let promedioAlumno = 0; // Variable para almacenar la suma de los promedios de cada unidad del alumno

            // Iterar sobre las calificaciones de cada unidad
            for (const calificacion of alumno.calificaciones) {
                let sumaPonderada = 0;
                let totalPonderacion = 0;

                // Buscar las actividades correspondientes a esta unidad en el modelo de grupo
                const unidad = group.unidades.find(u => u.unidad === calificacion.unidad);

                if (unidad) {
                    // Crear un mapa de actividades para evitar búsquedas repetidas
                    const actividadesMap = new Map();

                    for (const actividad of unidad.actividades) {
                        actividadesMap.set(actividad.nombre, actividad.porcentaje);
                    }

                    // Sumar la ponderación de cada actividad según los porcentajes del modelo de grupo
                    for (const actividad of calificacion.actividades) {
                        const porcentaje = actividadesMap.get(actividad.nombreActividad);

                        if (porcentaje) {
                            sumaPonderada += (actividad.calificacionActividad * porcentaje) / 100;
                            totalPonderacion += porcentaje;
                        }
                    }

                    const promedioUnidad = totalPonderacion > 0 ? parseFloat((sumaPonderada / totalPonderacion * 100).toFixed(2)) : 0;
                    // Actualizar el campo promedioUnidad en el objeto de calificación del alumno
                    calificacion.promedioUnidad = promedioUnidad;

                    // Sumar el promedio de esta unidad al promedio del alumno
                    promedioAlumno += promedioUnidad;
                }
            }

            // Calcular el promedio final del alumno
            const promedioFinalAlumno = alumno.calificaciones.length > 0 ? parseFloat((promedioAlumno / alumno.calificaciones.length).toFixed(2)) : 0;
            alumno.promedioFinal = promedioFinalAlumno;

            // Sumar el promedio final del alumno al total de promedios finales
            totalPromedioFinal += promedioFinalAlumno;
        }

        // Calcular el promedio final del grupo
        const promedioFinalGrupo = students.alumnos.length > 0 ? parseFloat((totalPromedioFinal / students.alumnos.length).toFixed(2)) : 0;
        students.promedioFinal = promedioFinalGrupo;

        // Guardar los cambios en el modelo de estudiantes
        await students.save();

        return 'Promedios calculados exitosamente';

    } catch (error) {
        throw new Error('Error al actualizar los promedios');
    }
}

async function getGroup(id) {
    const group = await groupModel.findById(id);
    if (!group) {
        throw new Error('Grupo no encontrado');
    }
    return group;
}

async function getStudents(group) {
    const students = await studentsModel.findById(group.listaAlumnos);
    if (!students) {
        throw new Error('El grupo no tiene alumnos');
    }
    return students;
}

export async function calculateGeneralAverages(id){
    try{
        const group = await getGroup(id);
        const students = await getStudents(group);
        const studentsTotal = students.alumnos.length;

        // Calcular y actualizar estadisticas por unidad del grupo y estudiantes
        const unitStatistics = {};
        students.alumnos.forEach(student => {
            // Iterar sobre las calificaciones de cada alumno
            student.calificaciones.forEach(calificacion => {
                const unit = calificacion.unidad;
                const averageUnit = calificacion.promedioUnidad;
            
                // Inicializar el objeto de estadísticas de unidad si aún no existe
                if (!unitStatistics[unit]) {
                    unitStatistics[unit] = {
                        reprobados: 0,
                        aprobados: 0,
                        desertores: 0
                    };
                }

                // Incrementar el contador correspondiente según el promedio de la unidad
                if (averageUnit > 0 && averageUnit < 70) {
                    unitStatistics[unit].reprobados++;
                } else if (averageUnit >= 70 && averageUnit <= 100) {
                    unitStatistics[unit].aprobados++;
                } else {
                    unitStatistics[unit].desertores++;
                }
            });
        });
        const units = Object.values(unitStatistics);
        //Guardar la informacion en el grupo
        group.unidades.forEach((unidad, index) => {
            const unitData = units[index];
            unidad.alumnosAprobados = unitData.aprobados;
            unidad.alumnosReprobados = unitData.reprobados;
            unidad.alumnosDesertados = unitData.desertores;
        });
        await group.save();

        // Calcular y actualizar promedio final grupal
        const finalAverageGroup = students.alumnos.
        reduce((acum, student) => acum + student.promedioFinal, 0) / studentsTotal;
        await groupModel.findByIdAndUpdate(id, {promedioGeneral : finalAverageGroup.toFixed(2)}, {new : true});

        // Contabilizar alumnos reprobados, aprobados y desertores por promedio final, ademas de 
        // separarlos por rango de calificaciones
        let final = {
            reprobados : 0,
            aprobados : 0,
            desertores : 0
        };
        let averageRange = {
            Rango_0_9 : 0,
            Rango_10_19 : 0,
            Rango_20_29 : 0,
            Rango_30_39 : 0,
            Rango_40_49 : 0,
            Rango_50_59 : 0,
            Rango_60_69 : 0,
            Rango_70_79 : 0,
            Rango_80_89 : 0,
            Rango_90_100 : 0,
        }
        students.alumnos.forEach(student => {
            if(student.promedioFinal > 0 && student.promedioFinal < 70){
                final.reprobados++;
            }else if(student.promedioFinal >= 70 && student.promedioFinal <= 100){
                final.aprobados++;
            }else{
                final.desertores++;
            }
        });
        students.alumnos.forEach(student => {
            const promedioFinal = student.promedioFinal;
            if (promedioFinal >= 0 && promedioFinal < 10) {
                averageRange.Rango_0_9++;
            } else if (promedioFinal >= 10 && promedioFinal < 20) {
                averageRange.Rango_10_19++;
            } else if (promedioFinal >= 20 && promedioFinal < 30) {
                averageRange.Rango_20_29++;
            } else if (promedioFinal >= 30 && promedioFinal < 40) {
                averageRange.Rango_30_39++;
            } else if (promedioFinal >= 40 && promedioFinal < 50) {
                averageRange.Rango_40_49++;
            } else if (promedioFinal >= 50 && promedioFinal < 60) {
                averageRange.Rango_50_59++;
            } else if (promedioFinal >= 60 && promedioFinal < 70) {
                averageRange.Rango_60_69++;
            } else if (promedioFinal >= 70 && promedioFinal < 80) {
                averageRange.Rango_70_79++;
            } else if (promedioFinal >= 80 && promedioFinal < 90) {
                averageRange.Rango_80_89++;
            } else if (promedioFinal >= 90 && promedioFinal <= 100) {
                averageRange.Rango_90_100++;
            }
        });

        // Actualizacion de la informacion final del grupo        
        group.alumnosAprobados = final.aprobados;
        group.alumnosReprobados = final.reprobados;
        group.alumnosDesertados = final.desertores;

        group.porcentajeAprobados = ((final.aprobados * 100) / studentsTotal).toFixed(2);
        group.porcentajeReprobados = ((final.reprobados * 100) / studentsTotal).toFixed(2);
        group.porcentajeDesertados = ((final.desertores * 100) / studentsTotal).toFixed(2);
        await group.save();

        //  Porcentajes de alumnos aprobados, reprobados y que desertaron 
        let finalPercentages = {
            aprobados : '',
            reprobados : '',
            desertores : ''
        }
        finalPercentages.aprobados = `${((final.aprobados * 100) / studentsTotal).toFixed(2)}%`;
        finalPercentages.reprobados = `${((final.reprobados * 100) / studentsTotal).toFixed(2)}%`;
        finalPercentages.desertores = `${((final.desertores * 100) / studentsTotal).toFixed(2)}%`;

        //Respuesta
        return { studentsTotal, finalAverageGroup, units, final, finalPercentages, averageRange };

    }catch(error){
        console.log(error);
        throw new Error('Error al calcular estadisticas');
    }
}