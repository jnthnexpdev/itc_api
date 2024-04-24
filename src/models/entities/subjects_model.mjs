import mongoose from 'mongoose';
const schema = mongoose.Schema;

const subjectsModel = new schema({
    carrera: { type: String, required: true },
    claveReticula: { type: String, required: true },
    fechaRegistro: { type: String },
    horaRegistro: { type: String },
    materias: [{
        nombreMateria: { type: String },
        claveMateria: { type: String },
        semestreMateria: { type: Number },
        descripcionMateria: { type: String },
    }]
});

subjectsModel.index({ Carrera: 1 });

const subjects = mongoose.model('Materias', subjectsModel);

export default subjects;