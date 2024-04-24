import adminModel from '../../models/users/admin_model.mjs';
import { handleServerError } from '../../utils/handle/handle_server.mjs';
import * as userUtils from '../../utils/user/user_utils.mjs';
import { getDateAndTime } from '../../utils/date/date_utils.mjs';

export const createAdminAccount = async(req, res) => {
    try{
        const body = req.body;
        const { fecha, hora } = await getDateAndTime();

        const existingAdmin = await adminModel.findOne({correo : body.correo});

        if(existingAdmin){
            return res.status(400).json({
                success : false,
                message : 'Este correo ya pertenece a una cuenta registrada'
            });
        }

        const admin = new adminModel({
            nombre : body.nombre,
            correo : body.correo,
            cuenta : 'Administrador',
            carrera : body.carrera,
            fechaRegistro : fecha,
            horaRegistro : hora,
            password : body.password,
            sesion : {
                ultimaSesion : '',
                codigoAcceso : '',
                validezCodigoAcceso : false,
            }
        });

        await admin.save(); 

        return res.status(200).json({
            success : true,
            message : 'Administrador registrado',
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const listAllAdmins  = async(req, res) => {
    
    try{
        const admins = await adminModel.find().select('-password');

        if(admins.length === 0 || admins === null){
            return res.status(404).json({
                success : false,
                message : 'Aun no hay administradores registrados en el sistema'
            });
        }

        return res.status(200).json({
            success : true,
            admins : admins
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const deleteAdmin = async(req, res) => {
    try{
        const id = req.params.id;
        const user = await userUtils.getUserById(id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : 'Usuario no eliminado, debido a que no existe'
            });
        }

        await adminModel.findByIdAndDelete(user.id);

        return res.status(200).json({
            success : true,
            message : 'Administrador eliminado'
        });

    }catch(error){
        handleServerError(res, error);
    }
}