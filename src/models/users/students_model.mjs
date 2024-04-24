import mongoose from 'mongoose';
const schema = mongoose.Schema;

const studentModel = new schema({
    alumnos: [{
        nombre: { type: String, required: true },
        numeroControl: { type: String, required: true },
        calificaciones: [{
            unidad: { type: Number, required: true },
            actividades: [{
                nombreActividad: { type: String, required: true },
                calificacionActividad: { type: Number, required: true, default: 0 },
            }],
            promedioUnidad: { type: Number, default: 0 }
        }],
        promedioFinal: { type: Number, default: 0 }
    }]
});

const student = mongoose.model('Alumnos', studentModel);

export default student;