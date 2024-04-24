import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default function authToken(){

    const allowedUsers = ['Administrador', 'Docente'];

    return async function(req, res, next){
        const token = req.signedCookies.session;

        if(!token){
            return res.status(401).json({
                success : false,
                message : 'Token no proporcionado'
            });
        }

        try{
            const decoded = await jwt.verify(token, process.env.SECRET);

            if(!decoded || !allowedUsers.includes(decoded.account)){
                return res.status(403).json({
                    success: false,
                    message: 'Acceso no autorizado'
                });
            }

            next();

        }catch(error){
            if(error.name === 'TokenExpiredError'){
                return res.status(400).json({
                    success: false,
                    message: 'Token expirado',
                    expiredAt : error.expiredAt
                });
            }else{
                return res.status(400).json({
                    success: false,
                    message: 'Token invalido',
                });
            }
        }
    }
}