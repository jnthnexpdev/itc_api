import csv from 'csv-parser';
import stream from 'node:stream';
import subjectsModel from '../../models/entities/subjects_model.mjs';
import { getDateAndTime } from '../date/date_utils.mjs';

export function importSubjects(file, key_subjects, career) {
    return new Promise(async (resolve, reject) => {
        const { fecha, hora } = await getDateAndTime();
        const dataCSV = [];
        const readable = stream.Readable;

        const readableStream = new readable();
        readableStream.push(file.buffer);
        readableStream.push(null);

        readableStream
        .pipe(csv())
        .on('data', (row) => {
            let semestreIndex = 0;
            for (const semestre in row) {
                semestreIndex++;
                const materiaInfo = row[semestre].split(' ');
                const claveMateria = materiaInfo[0];
                const materiaWords = row[semestre].split(' ').filter(word => !/\d/.test(word));
                const materia = materiaWords.join(' ');
                const semestreMateria = semestreIndex;
                const descripcionMateria = row[semestre];
              
                if (materia.trim() !== '') {
                  const materiaObject = {
                      nombreMateria: materia,
                      claveMateria: claveMateria,
                      semestreMateria: semestreMateria,
                      descripcionMateria: descripcionMateria,
                  };
                  dataCSV.push(materiaObject);
                }
            }
        })
        .on('end', () => {
            subjectsModel.create({
                carrera : career,
                claveReticula : key_subjects,
                fechaRegistro : fecha,
                horaRegistro : hora,
                materias : dataCSV
            })
            .then(() => {
                resolve('Materias guardadas en MongoDB');
            })
            .catch((error) => {
                reject('Error al guardar los datos en mongodb', error);
                console.error(error);
            });
        });
    });
}