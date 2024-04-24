import mongoose from 'mongoose';
const schema = mongoose.Schema;

const periodModel = new schema({
    periodo: { type: String, required: true },
    carrera: { type: String, required: true },
    idReticula: { type: schema.Types.ObjectId, ref: 'Materias', required: true },
    fechaRegistro: { type: String },
    horaRegistro: { type: String },
});

const period = mongoose.model('Periodos', periodModel);

export default period;