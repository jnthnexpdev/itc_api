import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const schema = mongoose.Schema;

const teacherModel = new schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique : true },
    cuenta: { type: String, required: true },
    fechaRegistro: { type: String },
    horaRegistro: { type: String },
    password: { type: String, required: true },
    sesion: {
        ultimaSesion: { type: String },
        codigoAcceso: { type: String },
        validezCodigoAcceso: { type: Boolean } 
    },
    carreras: [{
        carrera: { type: String }
    }]
});

teacherModel.pre('save', async function(next) {
    try{
        const salt = 12;
        const hash = await bcrypt.hash(this.password, salt);
        this.password = hash;
        next();
    }catch(error){
        next(error);
    }
});

const teacher = mongoose.model('Docentes', teacherModel);

export default teacher;