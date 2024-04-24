import csv from 'csv-parser';
import stream from 'node:stream';
import studentsModel from '../../models/users/students_model.mjs';
import groupModel from '../../models/entities/group_model.mjs';

export function importStudents(file, idGroup) {
    return new Promise((resolve, reject) => {
        const dataCSV = [];

        const readable = stream.Readable;
        const readableStream = new readable();
        readableStream.push(file.buffer);
        readableStream.push(null);

        readableStream
            .pipe(csv())
            .on('data', (row) => {
                const numeroControl = row['No de Control'];
                const nombreCompleto = row['Nombre Completo'];

                if (numeroControl && nombreCompleto) {
                    const alumnoObject = {
                        numeroControl: numeroControl.trim(),
                        nombre: nombreCompleto.trim(),
                    };
                    dataCSV.push(alumnoObject);
                }
            })
            .on('end', () => {
                studentsModel.create({ alumnos: dataCSV })
                .then(async (createdDocument) => {
                    const idList = createdDocument._id;
                    await groupModel.findByIdAndUpdate(idGroup , { listaAlumnos : idList }, { new : true });
                
                    resolve('Datos de alumnos guardados en MongoDB');
                })
                .catch((error) => {
                    reject('Error al guardar los datos de alumnos en MongoDB', error);
                    console.error(error);
                });
            });
    });
}