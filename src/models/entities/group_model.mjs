import mongoose from "mongoose";
const schema = mongoose.Schema;

const groupModel = new schema({
   periodo: { type: String },
   numeroGrupo: { type: Number, required: true },
   materia: { type: schema.Types.ObjectId, ref: 'Materias' },
   docente: { type: schema.Types.ObjectId, ref: 'Docentes' },
   unidades: [{
      unidad: { type: Number, required: true },
      actividades: [{
         nombre: { type: String, required: true },
         porcentaje: { type: Number, required: true }
      }],
      alumnosAprobados: { type: Number, default: 0 },
      alumnosReprobados: { type: Number, default: 0 },
      alumnosDesertados: { type: Number, default: 0 },
      promedioUnidad: { type: Number, default: 0 },
   }],
   alumnosAprobados: { type: Number, default: 0 },
   alumnosReprobados: { type: Number, default: 0 },
   alumnosDesertados: { type: Number, default: 0 },
   porcentajeAprobados: { type: Number, default: 0 },
   porcentajeReprobados: { type: Number, default: 0 },
   porcentajeDesertados: { type: Number, default: 0 },
   promedioGeneral: { type: Number, default: 0 },
   listaAlumnos: { type: schema.Types.ObjectId, ref: 'Alumnos' }
});
 
const group = mongoose.model('Grupos', groupModel);

export default group;