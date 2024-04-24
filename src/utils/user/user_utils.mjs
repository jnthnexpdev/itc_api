import teacherModel from '../../models/users/teacher_model.mjs';
import adminModel from '../../models/users/admin_model.mjs';
import { getDateAndTime } from '../../utils/date/date_utils.mjs';

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export async function getUserIdFromCookie(req){
    const cookie = req.signedCookies.session;
    if (!cookie) {
        throw new Error('Cookie session no encontrada');
    }

    try {
        const decoded = jwt.verify(cookie, process.env.SECRET);
        return decoded._id;
    } catch (error) {
        throw new Error('Error al decodificar la cookie');
    }
}

export async function getUserByEmail(email){
    try{
        const admin = await adminModel.findOne({ correo : email});
        const teacher = await teacherModel.findOne({ correo : email});
        return admin || teacher;
    }catch(error){
        console.error(error);
        throw new Error('Error al buscar el usuario');
    }
}

export async function getUserById(id){
    try{
        const admin = await adminModel.findById(id).select('-password');
        const teacher = await teacherModel.findById(id).select('-password');
        return admin || teacher;
    }catch(error){
        console.error(error);
        throw new Error('Error al buscar el usuario');
    }
}

export async function createToken(user){
    try{
        const {fecha, hora} = await getDateAndTime();

        const tokenData = {
            _id : user._id,
            account : user.cuenta,
            name : user.nombre,
            time :hora,
            date : fecha
        };

        const token = jwt.sign(
            tokenData, 
            process.env.SECRET,
            { expiresIn: '6h', algorithm: 'HS256' }
        );
        return { token };
    }catch(error){
        console.error(error);
        throw new Error('Error al crear el token');
    }
}

export async function updateLastSession(email, account){
    try{
        const { fecha, hora } = await getDateAndTime();
        const dateTime = `${hora}, ${fecha}`;

        if(account === 'Administrador'){
            await adminModel.findOneAndUpdate(
                { correo : email },
                { 'sesion.ultimaSesion' : dateTime },
                { new : true }
            );
        }else if(account === 'Docente'){
            await teacherModel.findOneAndUpdate(
                { correo : email },
                { 'sesion.ultimaSesion' : dateTime },
                { new : true }
            );
        }
        return true;
    }catch(error){
        console.error('Error al actualizar la ultima sesion: ', error);
    }
}

export async function updateSessionCode(user, code){
    try{

        if(user.cuenta === 'Administrador'){
            await adminModel.findOneAndUpdate(
                { correo : user.correo },
                { 'sesion.codigoAcceso' : code, 'sesion.validezCodigoAcceso' : true },
                { new : true }
            );
        }else if(user.cuenta === 'Docente'){
            await teacherModel.findOneAndUpdate(
                { correo : user.correo },
                { 'sesion.codigoAcceso' : code, 'sesion.validezCodigoAcceso' : true  },
                { new : true }
            );
        }

        return true;
    }catch(error){
        console.error('Error al actualizar la ultima sesion: ', error);
    }
}

export async function updateSessionCodeValidity (user){
    try{

        if(user.cuenta === 'Administrador'){
            await adminModel.findOneAndUpdate(
                { correo : user.correo },
                { 'sesion.codigoAcceso' : null, 'sesion.validezCodigoAcceso' : false },
                { new : true }
            );
        }else if(user.cuenta === 'Docente'){
            await teacherModel.findOneAndUpdate(
                { correo : user.correo },
                { 'sesion.codigoAcceso' : null, 'sesion.validezCodigoAcceso' : false  },
                { new : true }
            );
        }

        return true;
    }catch(error){
        console.error('Error al actualizar la ultima sesion: ', error);
    }
}