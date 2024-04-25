import authToken from '../../middlewares/auth_token.mjs';
import { handleServerError } from '../../utils/handle/handle_server.mjs';
import * as userUtils from '../../utils/user/user_utils.mjs';
import * as emailUtils from '../../utils/emails/email_utils.mjs';

import bcrypt from 'bcrypt';
import randomString from 'randomstring';

export const loginUser = async(req, res) => {
    try{
        const { correo, password } = req.body;
        const user = await userUtils.getUserByEmail(correo);

        if(!user){
            return res.status(404).json({
                success : false,
                message : 'Este correo no pertenece a ninguna cuenta registrada'
            });
        }

        if(bcrypt.compareSync(password, user.password)){
            await userUtils.updateLastSession(user.correo, user.cuenta);

            const { token } = await userUtils.createToken(user);

            res.cookie('session', token, {
                httpOnly : false,
                signed : true,
                sameSite : 'None',
                path: '/',
                secure: true,
            });

            return res.status(200).json({
                success : true,
                message : 'Sesion iniciada',
                token : token
            });
        }else{
            return res.status(401).json({
                success : false,
                message : 'Correo electrónico y/o contraseña incorrectos',
            });
        }
    }catch(error){
        handleServerError(res, error);
    }
};

export const logOutUser = async(req, res) => {
    try{
        res.cookie('session', '', {
            path: '/',
            expires: new Date(0),
            httpOnly: false,
            secure: true,
            signed : true,
            sameSite: 'None'
        });

        return res.status(200).json({
            success : true,
            message : 'Sesion cerrada'
        });
    }catch(error){
        handleServerError(res, error);
    }
};

export const generateAccessCode = async(req, res) => {
    try{
        const email = req.body.correo;
        const user = await userUtils.getUserByEmail(email);

        if(!user){
            return res.status(404).json({
                success : false,
                message : 'Este correo no pertenece a ninguna cuenta registrada'
            });
        }

        const accessCode = randomString.generate(6);
        await userUtils.updateSessionCode(user, accessCode);

        const sendEmail = await emailUtils.sendEmailAccessCode(email, accessCode);
        
        if(!sendEmail){
            return res.status(400).json({
                success : false,
                message : 'Ha ocurrido un error el enviar el correo, intenta mas tarde'
            });
        }

        return res.status(200).json({
            success : true,
            message : 'Correo enviado'
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const validateAccessCode = async(req, res) => {
    try{
        const email = req.body.correo;
        const code = req.body.codigo;
        const user = await userUtils.getUserByEmail(email);

        if(user.sesion.codigoAcceso === code && user.sesion.validezCodigoAcceso === true){
            await userUtils.updateLastSession(user.correo, user.cuenta);
            await userUtils.updateSessionCodeValidity(user);
            const { token } = await userUtils.createToken(user);

            res.cookie('session', token, {
                httpOnly : false,
                signed : true,
            });

            return res.status(200).json({
                success : true,
                message : 'Sesion iniciada',
                token : token
            });
        }else{
            return res.status(401).json({
                success : false,
                message : 'Codigo incorrecto',
            });
        }
    }catch(error){
        handleServerError(res, error);
    }
}

export const infoUser = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);

        if(!user){
            return res.status(404).json({
                success : false,
                message : 'Usuario no encontrado'
            });
        }

        return res.status(200).json({
            success : true,
            user : user
        });

    }catch(error){
        handleServerError(res, error);
    }
}

export const authUser = async(req, res) => {
    try{
        await authToken()(req, res, async(error) => {
            if(error){
                return res.status(401).json({
                    success : false,
                    message : 'Usuario no autenticado'
                }); 
            }
            
            return res.status(200).json({
                success : true,
                message : 'Usuario autenticado'
            });
        });
    }catch(error){
        handleServerError(res, error);
    }
}

export const identifyUserType = async(req, res) => {
    try{
        const id = await userUtils.getUserIdFromCookie(req);
        const user = await userUtils.getUserById(id);

        return res.status(200).json({
            success : true,
            account : user.cuenta
        });

    }catch(error){
        handleServerError(res, error);
    }
}